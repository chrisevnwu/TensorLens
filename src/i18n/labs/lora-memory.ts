import type {ExactStringTree} from '../types'
const en={
 title:'Fine-tuning memory budget',full:'Full FT',lora:'LoRA',qlora:'QLoRA',baseBytes:'Base weights',adapterBytes:'Adapters',
 gradientBytes:'Gradients',optimizerBytes:'Optimizer states',activationBytes:'Activations',total:'Total',assumptions:'Memory assumptions',
 sizes:'This size class uses {layers} layers and hidden width {hidden}. Estimates use decimal GB, a microbatch of one and {tokens} tokens.',
 adapters:'Q and V each receive two low-rank factors. LoRA trains FP32 adapters. QLoRA trains BF16 adapters on a frozen NF4 base, with one FP16 scale per 64 weights.',
 states:'Gradients match the trainable weights’ precision. AdamW keeps two FP32 moments and an FP32 master copy for BF16 trainable weights. The activation estimate retains two BF16 hidden states per layer. Workspace and allocator overhead depend on the training system.',
} as const
const zh:ExactStringTree<typeof en>={
 title:'微调显存预算',full:'全量微调',lora:'LoRA',qlora:'QLoRA',baseBytes:'基础权重',adapterBytes:'适配器',
 gradientBytes:'梯度',optimizerBytes:'优化器状态',activationBytes:'激活值',total:'合计',assumptions:'显存估算假设',
 sizes:'此规模示例有 {layers} 层，隐藏宽度为 {hidden}。显存按十进制 GB 计，微批次大小为 1，序列长度为 {tokens}。',
 adapters:'每层的 Q 和 V 投影各训练两个低秩因子。LoRA 使用 FP32 适配器。QLoRA 使用 BF16 适配器，冻结的 NF4 基座每 64 个权重共用一个 FP16 缩放系数。',
 states:'梯度精度与可训练权重一致。AdamW 保存两个 FP32 动量，并为 BF16 可训练权重保存 FP32 主副本。激活值按每层保留两份 BF16 隐藏状态估算。临时工作区和内存分配器开销取决于实际训练系统。',
}
export const loraMemoryCopy={en,zh}
