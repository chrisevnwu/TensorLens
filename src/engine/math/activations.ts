const geluScale = Math.sqrt(2 / Math.PI)

/** Tanh GELU and the exact local derivative of that same approximation. */
export function geluWithDerivative(x: number) {
  const t = Math.tanh(geluScale * (x + 0.044715 * x ** 3))
  const gate = (1 + t) / 2
  const slope = Math.abs(t) === 1 ? gate
    : gate + (x / 2) * (1 - t * t) * geluScale * (1 + 3 * 0.044715 * x * x)
  return { value: x * gate, slope }
}
