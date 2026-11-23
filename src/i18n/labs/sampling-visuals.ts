import type {ExactStringTree} from '../types'
const en={
  distribution:'Token probabilities',kept:'Retained','top-k':'Top-K cut','top-p':'Top-P cut','min-p':'Min-P cut',
  theory:'At this stage',empirical:'Sample frequency',mass:'Cumulative mass before filtering',rank:'Token rank',drag:'Drag raw logits',
  draw:'Sample 1×',batch:'Sample 100×',clear:'Clear samples',draws:'Draws',last:'Last draw',token:'Token',
  logit:'Raw logit',adjusted:'After penalties',prior:'Prior occurrences',base:'Before filtering',final:'Final probability',count:'Sample count',status:'Filter result',
} as const
const zh:ExactStringTree<typeof en>={
  distribution:'词元概率',kept:'保留','top-k':'Top-K 截断','top-p':'Top-P 截断','min-p':'Min-P 截断',
  theory:'当前阶段',empirical:'采样频率',mass:'筛选前的累积概率',rank:'词元排名',drag:'拖动原始 logits',
  draw:'采样 1 次',batch:'采样 100 次',clear:'清空采样',draws:'采样次数',last:'最近采样',token:'词元',
  logit:'原始 logit',adjusted:'惩罚后的 logit',prior:'此前出现次数',base:'筛选前概率',final:'最终概率',count:'采样计数',status:'筛选结果',
}
export const samplingVisuals={en,zh}
