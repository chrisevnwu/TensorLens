import type { ExactStringTree } from '../types'

const en = {
  wheels: 'Rotation planes', plane: 'Plane', fastest: 'High frequency', slowest: 'Low frequency',
  original: 'Original vectors', angle: 'Relative phase', frequency: 'Angular frequency', frequencyUnit: 'rad/token',
  decay: 'Dot product by relative distance', offset: 'Relative distance', dot: 'Dot product',
  none: 'Unscaled', pi: 'PI', ntk: 'NTK', sinusoidal: 'Additive sinusoidal',
  rotation: 'Rotation', input: 'Input', output: 'Rotated', vector: 'Vector',
} as const
const zh: ExactStringTree<typeof en> = {
  wheels: '旋转平面', plane: '平面', fastest: '高频', slowest: '低频',
  original: '原始向量', angle: '相对相位', frequency: '角频率', frequencyUnit: '弧度/词元',
  decay: '点积与相对距离', offset: '相对距离', dot: '点积',
  none: '无缩放', pi: 'PI', ntk: 'NTK', sinusoidal: '加性正弦编码',
  rotation: '旋转角', input: '输入', output: '旋转后', vector: '向量',
}
export const ropeVisuals = { en, zh }
