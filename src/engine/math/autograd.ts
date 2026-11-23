export type AutogradOp = 'input' | 'param' | 'add' | 'sub' | 'mul' | 'div'
  | 'pow' | 'exp' | 'log' | 'relu' | 'gelu' | 'tanh' | 'sigmoid'

export interface AutogradNodeSnapshot {
  id: string
  label: string
  op: AutogradOp
  value: number
  grad: number
  parentIds: string[]
  localGradFormula: string
  /** One partial per input slot, including repeated operands such as x*x. */
  localDerivatives: number[]
}

const epsilon = 1e-12
const maxLog = Math.log(Number.MAX_VALUE)
const geluScale = Math.sqrt(2 / Math.PI)

export class Value {
  grad = 0
  private scope: Value[]
  private index: number

  constructor(
    public value: number,
    public label = String(value),
    public readonly op: AutogradOp = 'input',
    public readonly parents: Value[] = [],
    public readonly localDerivatives: readonly number[] = [],
    public readonly localGradFormula = '',
  ) {
    if (!Number.isFinite(value) || localDerivatives.some(slope => !Number.isFinite(slope))) {
      throw new RangeError('Autograd requires finite real values and partial derivatives')
    }
    if (parents.length !== localDerivatives.length) throw new RangeError('Each edge needs a derivative')
    // Joining independent graphs reconciles their indices. No process-wide ID counter.
    this.scope = parents.reduce<Value[]>((largest, node) =>
      node.scope.length > largest.length ? node.scope : largest, [])
    for (const parent of parents) {
      if (parent.scope === this.scope) continue
      for (const node of parent.scope) {
        node.index = this.scope.length
        node.scope = this.scope
        this.scope.push(node)
      }
    }
    this.index = this.scope.length
    this.scope.push(this)
  }

  get id() { return 'n' + this.index }

  private binary(other: Value | number) { return other instanceof Value ? other : new Value(other) }

  add(other: Value | number, label = '+') {
    const b = this.binary(other)
    return new Value(this.value + b.value, label, 'add', [this, b], [1, 1], '(1, 1)')
  }

  sub(other: Value | number, label = '−') {
    const b = this.binary(other)
    return new Value(this.value - b.value, label, 'sub', [this, b], [1, -1], '(1, −1)')
  }

  mul(other: Value | number, label = '×') {
    const b = this.binary(other)
    return new Value(this.value * b.value, label, 'mul', [this, b], [b.value, this.value], '(b, a)')
  }

  div(other: Value | number, label = '÷') {
    const b = this.binary(other)
    const guarded = Math.abs(b.value) < epsilon
    const sign = b.value < 0 || Object.is(b.value, -0) ? -1 : 1
    const denominator = guarded ? sign * epsilon : b.value
    const quotient = this.value / denominator
    return new Value(quotient, label, 'div', [this, b],
      [1 / denominator, guarded ? 0 : -quotient / denominator],
      guarded ? '(1/bε, 0)' : '(1/b, −a/b²)')
  }

  private unary(op: AutogradOp, value: number, slope: number, formula: string, label: string) {
    return new Value(value, label, op, [this], [slope], formula)
  }

  pow(exponent: number, label = '^' + exponent) {
    const slope = exponent === 0 ? 0 : exponent * this.value ** (exponent - 1)
    return this.unary('pow', this.value ** exponent, slope, 'p·x^(p−1)', label)
  }

  exp(label = 'exp') {
    const saturated = this.value > maxLog
    const out = saturated ? Number.MAX_VALUE : Math.exp(this.value)
    return this.unary('exp', out, saturated ? 0 : out, saturated ? '0' : 'exp(x)', label)
  }

  log(label = 'log') {
    const x = Math.max(this.value, epsilon)
    return this.unary('log', Math.log(x), this.value <= epsilon ? 0 : 1 / x, this.value <= epsilon ? '0' : '1/x', label)
  }

  relu(label = 'ReLU') {
    return this.unary('relu', Math.max(this.value, 0), Number(this.value > 0), '1[x > 0]', label)
  }

  /** Common tanh-approximation to GELU, differentiated using its own forward expression. */
  gelu(label = 'GELU') {
    const x = this.value
    const t = Math.tanh(geluScale * (x + 0.044715 * x ** 3))
    const gate = (1 + t) / 2
    const slope = Math.abs(t) === 1 ? gate : gate + (x / 2) * (1 - t * t) * geluScale * (1 + 3 * 0.044715 * x * x)
    return this.unary('gelu', x * gate, slope, '(1+t)/2 + x·(1−t²)·u′/2', label)
  }

  tanh(label = 'tanh') {
    const out = Math.tanh(this.value)
    return this.unary('tanh', out, 1 - out * out, '1−tanh²(x)', label)
  }

  sigmoid(label = 'σ') {
    const z = Math.exp(-Math.abs(this.value))
    const out = this.value >= 0 ? 1 / (1 + z) : z / (1 + z)
    return this.unary('sigmoid', out, z / (1 + z) ** 2, 'σ(x)(1−σ(x))', label)
  }

  topologicalOrder(): Value[] {
    const ordered: Value[] = []
    const seen = new Set<Value>()
    const stack = [{ node: this as Value, expanded: false }]
    while (stack.length) {
      const { node, expanded } = stack.pop()!
      if (expanded) { ordered.push(node); continue }
      if (seen.has(node)) continue
      seen.add(node)
      stack.push({ node, expanded: true })
      for (let i = node.parents.length - 1; i >= 0; i--) {
        stack.push({ node: node.parents[i]!, expanded: false })
      }
    }
    return ordered
  }

  private propagate(onStep?: (order: readonly Value[]) => void) {
    const order = this.topologicalOrder()
    for (const node of order) node.grad = 0
    this.grad = 1
    onStep?.(order)
    for (let i = order.length - 1; i >= 0; i--) {
      const node = order[i]!
      node.parents.forEach((parent, j) => { parent.grad += node.grad * node.localDerivatives[j]! })
      onStep?.(order)
    }
  }

  backward(): void { this.propagate() }

  backwardTrace(): AutogradNodeSnapshot[][] {
    const trace: AutogradNodeSnapshot[][] = []
    this.propagate(order => trace.push(order.map(node => ({
      id: node.id, label: node.label, op: node.op, value: node.value, grad: node.grad,
      parentIds: node.parents.map(parent => parent.id),
      localGradFormula: node.localGradFormula, localDerivatives: [...node.localDerivatives],
    }))))
    return trace
  }
}
