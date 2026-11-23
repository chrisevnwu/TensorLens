import { evaluateLandscape, type Landscape } from './landscape'
import { learningRateAt, type LrSchedule } from './schedule'

export const OPTIMIZERS = ['sgd', 'momentum', 'rmsprop', 'adam', 'adamw'] as const
export type OptimizerId = typeof OPTIMIZERS[number]
interface Hyperparameters {
  learningRate: number
  beta1: number
  beta2: number
  weightDecay: number
}
export interface RaceConfig extends Hyperparameters {
  landscape: Landscape
  startX: number
  startY: number
  lrSchedule: LrSchedule
}
export interface RacePoint {
  x: number
  y: number
  loss: number
  gradNorm: number
  diverged: boolean
}
export interface RaceFrame {
  step: number
  learningRate: number
  points: Record<OptimizerId, RacePoint>
}
export interface OptimizerState {
  x: number
  y: number
  step: number
  mx: number
  my: number
  vx: number
  vy: number
}
export function initialOptimizerState(x: number, y: number): OptimizerState {
  return { x, y, step: 0, mx: 0, my: 0, vx: 0, vy: 0 }
}

export function optimizerStep(id: OptimizerId, previous: OptimizerState, gradient: {dx: number; dy: number}, config: Hyperparameters): OptimizerState {
  const {beta1, beta2, learningRate, weightDecay} = config
  const step = previous.step + 1
  const {dx,dy} = gradient
  let mx = previous.mx, my = previous.my, vx = previous.vx, vy = previous.vy
  let ux = dx, uy = dy
  if (id === 'momentum') {
    mx = beta1 * mx + dx; my = beta1 * my + dy
    ux = mx; uy = my
  } else if (id === 'rmsprop' || id === 'adam' || id === 'adamw') {
    vx = beta2 * vx + (1 - beta2) * dx ** 2
    vy = beta2 * vy + (1 - beta2) * dy ** 2
    if (id === 'rmsprop') {
      ux = dx / (Math.sqrt(vx) + 1e-8)
      uy = dy / (Math.sqrt(vy) + 1e-8)
    } else {
      mx = beta1 * mx + (1 - beta1) * dx
      my = beta1 * my + (1 - beta1) * dy
      const mCorrection = 1 - beta1 ** step, vCorrection = 1 - beta2 ** step
      ux = (mx / mCorrection) / (Math.sqrt(vx / vCorrection) + 1e-8)
      uy = (my / mCorrection) / (Math.sqrt(vy / vCorrection) + 1e-8)
    }
  }
  const decay = id === 'adamw' ? 1 - learningRate * weightDecay : 1
  return { x: decay * previous.x - learningRate * ux, y: decay * previous.y - learningRate * uy, step, mx, my, vx, vy }
}

// Stop evaluating a runaway trajectory before large powers in the landscape can overflow.
// The first rejected update leaves the last evaluated point intact and sets diverged.
export const DIVERGENCE_LIMIT = 1e6
function validCoordinate(x: number) { return Number.isFinite(x) && Math.abs(x) <= DIVERGENCE_LIMIT }
function perOptimizer<T>(make: (id: OptimizerId) => T): Record<OptimizerId,T> {
  return Object.fromEntries(OPTIMIZERS.map(id => [id, make(id)])) as Record<OptimizerId,T>
}

export function runRace(config: RaceConfig, steps = 100): RaceFrame[] {
  if (!Number.isInteger(steps) || steps < 0 || !validCoordinate(config.startX) || !validCoordinate(config.startY)) {
    throw new RangeError('Invalid starting point or step count')
  }
  if (![config.beta1, config.beta2].every(beta => beta >= 0 && beta < 1) || !Number.isFinite(config.weightDecay) || config.weightDecay < 0) {
    throw new RangeError('Invalid optimizer parameters')
  }
  const states = perOptimizer(() => initialOptimizerState(config.startX,config.startY))
  const start = evaluateLandscape(config.landscape,config.startX,config.startY)
  let points = perOptimizer(() => ({x:config.startX, y:config.startY, loss:start.loss, gradNorm:Math.hypot(start.dx,start.dy), diverged:false}))
  const gradients = perOptimizer(() => start)
  const rateAt = (step: number) => learningRateAt(config.lrSchedule,config.learningRate,step,Math.max(1,steps))
  const frames: RaceFrame[] = [{step:0, learningRate:rateAt(0), points}]
  for (let step = 1; step <= steps; step++) {
    const learningRate = rateAt(step)
    points = perOptimizer(id => {
      const last = points[id]
      if (last.diverged) return last
      const next = optimizerStep(id, states[id], gradients[id], {...config,learningRate})
      if (!validCoordinate(next.x) || !validCoordinate(next.y)) return {...last,diverged:true}
      const gradient = evaluateLandscape(config.landscape, next.x, next.y)
      states[id] = next
      gradients[id] = gradient
      return {x:next.x, y:next.y, loss:gradient.loss,gradNorm:Math.hypot(gradient.dx,gradient.dy),diverged:false}
    })
    frames.push({step,learningRate,points})
  }
  return frames
}
