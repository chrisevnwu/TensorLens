import type { ExactStringTree } from '../types'
const en={
  schedule:'Forward diffusion schedule',signal:'Signal power',snr:'Log signal-to-noise ratio',time:'Forward diffusion time',
  hint:'Select a noise level to move all trajectories to the matching reverse step. Flow uses its own linear interpolation clock.',
  clean:'Clean endpoint',infinite:'At clean time the noise variance is zero and log SNR is infinite.',
} as const
const zh:ExactStringTree<typeof en>={
  schedule:'前向扩散噪声日程',signal:'信号功率',snr:'对数信噪比',time:'前向扩散时间',
  hint:'选择噪声水平可将所有轨迹移到相应的反向步骤。流匹配采用自己的线性插值时间。',
  clean:'无噪声端点',infinite:'无噪声端点的噪声方差为零，对数信噪比为正无穷。',
}
export const noiseChartCopy={en,zh}
