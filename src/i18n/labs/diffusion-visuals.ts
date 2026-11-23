import type {ExactStringTree} from '../types'
const en={
  swarm:'Particle trajectories',compare:'Solver comparison',ddpm:'DDPM',ddim:'DDIM',flow:'Flow Matching',
  classA:'Target class A',classB:'Target class B',particles:'Particles',trails:'Particle trails',selectedTrail:'Inspected path',pathLength:'Path length',displacement:'Displacement',
  score:'Score direction',velocity:'Velocity direction',particle:'Inspect particle',distance:'Mean target distance',
  straightness:'Path / displacement',purity:'Class A purity',clock:'Solver time',stats:'Solver metrics',
}
const zh:ExactStringTree<typeof en>={
  swarm:'粒子轨迹',compare:'求解器对比',ddpm:'DDPM',ddim:'DDIM',flow:'流匹配',
  classA:'目标类别 A',classB:'目标类别 B',particles:'粒子',trails:'粒子轨迹',selectedTrail:'选中轨迹',pathLength:'路径长度',displacement:'位移',
  score:'得分场方向',velocity:'速度场方向',particle:'检查粒子',distance:'平均目标距离',
  straightness:'路径长度 / 位移',purity:'类别 A 纯度',clock:'求解器时间',stats:'求解器指标',
}
export const diffusionVisuals={en,zh}
