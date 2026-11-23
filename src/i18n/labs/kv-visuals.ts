import type { ExactStringTree } from '../types'
const en = {
  trace:'Autoregressive execution',cached:'With KV cache',uncached:'Without KV cache',prefill:'Prefill',decode:'Decode',
  new:'New computation',reused:'Reused KV',redundant:'Repeated work',masked:'Masked',weights:'Model weights',activations:'Activations',memory:'VRAM budget',
  total:'Allocated',capacity:'Capacity',oom:'Out of memory',roof:'GPU roofline',probe:'Explore intensity',ridge:'Ridge',
  newest:'Latest token output',tokenIds:'Token IDs',cumulative:'Cumulative FLOPs',path:'Path',step:'Step FLOPs',
  intensity:'Intensity',throughput:'Throughput',phase:'Phase',bound:'Limit',compute:'Compute',bandwidth:'Bandwidth',
  equivalent:'Max output difference',
} as const
const zh: ExactStringTree<typeof en> = {
  trace:'自回归执行轨迹',cached:'使用 KV 缓存',uncached:'不使用 KV 缓存',prefill:'预填充',decode:'解码',
  new:'新计算',reused:'复用的 KV',redundant:'重复计算',masked:'已掩码',weights:'模型权重',activations:'激活值',memory:'显存预算',
  total:'已分配',capacity:'容量',oom:'显存不足',roof:'GPU 屋顶线',probe:'探索计算强度',ridge:'脊点',
  newest:'最新词元输出',tokenIds:'词元 ID',cumulative:'累计 FLOPs',path:'路径',step:'本步 FLOPs',
  intensity:'计算强度',throughput:'吞吐量',phase:'阶段',bound:'瓶颈',compute:'算力',bandwidth:'内存带宽',equivalent:'最大输出差异',
}
export const kvVisuals = { en, zh }
