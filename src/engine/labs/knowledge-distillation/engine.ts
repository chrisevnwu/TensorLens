import { logSumExp } from '../../math/matrix'

function distribution(logits: readonly number[], temperature: number) {
  if (logits.length !== 3 || !logits.every(Number.isFinite)) throw new RangeError('Expected three finite class logits')
  const maximum = Math.max(...logits)
  const shifted = logits.map(logit => (logit - maximum) / temperature)
  const normalizer = logSumExp(shifted)
  const logP = shifted.map(value => value - normalizer)
  return { logP, p: logP.map(Math.exp) }
}

/** Class zero is the observed hard label. The teacher stays frozen for every update. */
export function objective(teacherLogits: readonly number[], studentLogits: readonly number[], temperature: number, alpha: number) {
  if (!Number.isFinite(temperature) || temperature <= 0 || !(alpha >= 0 && alpha <= 1)) {
    throw new RangeError('Invalid temperature or distillation weight')
  }
  const teacher = distribution(teacherLogits, temperature)
  const student = distribution(studentLogits, temperature)
  const ordinary = distribution(studentLogits, 1)
  const hardLoss = -ordinary.logP[0]!
  const softKL = Math.max(0, teacher.p.reduce((sum, p, i) => sum + p * (teacher.logP[i]! - student.logP[i]!), 0))
  const loss = (1 - alpha) * hardLoss + alpha * temperature ** 2 * softKL
  const gradient = ordinary.p.map((p, i) =>
    (1 - alpha) * (p - Number(i === 0)) + alpha * temperature * (student.p[i]! - teacher.p[i]!))
  return { probability: ordinary.p, teacherSoft: teacher.p, studentSoft: student.p, hardLoss, softKL, loss, gradient }
}

export interface DistillConfig {
  alpha: number
  temperature: number
  tail: number
}

export const UPDATES = 60
export const LEARNING_RATE = .5

export function trainDistillation({ alpha, temperature, tail }: DistillConfig) {
  if (!(tail >= -2 && tail <= 2)) throw new RangeError('Teacher tail must be between -2 and 2')
  const teacher = [3, tail, -tail]
  let logits = [0, 0, 0]
  let hardLogits = [0, 0, 0]
  const trace = []
  for (let step = 0; step <= UPDATES; step++) {
    const student = objective(teacher, logits, temperature, alpha)
    const baseline = objective(teacher, hardLogits, temperature, 0)
    trace.push({ teacherLogits: teacher, logits, student, baseline,
      runnerUpGap: student.probability[1]! - student.probability[2]! })
    if (step === UPDATES) break
    logits = logits.map((z, i) => z - LEARNING_RATE * student.gradient[i]!)
    hardLogits = hardLogits.map((z, i) => z - LEARNING_RATE * baseline.gradient[i]!)
  }
  return trace
}
export type DistillFrame = ReturnType<typeof trainDistillation>[number]
