import type { ExactStringTree } from '../types'
const en={
  presets:{clean:'Clean Gaussian INT4',outlier:'Per-tensor outlier stress',recovery:'Group-wise NF4 recovery',precision:'BF16 vs FP16 inspector'},
  mode:'Experiment view',modes:{tensor:'Tensor quantization',bits:'IEEE 754 / FP8 bit lab'},
  method:'Quantization method',methods:{fp16:'FP16',bf16:'BF16',fp8_e4m3:'FP8 E4M3',int8_sym:'INT8 symmetric',int8_asym:'INT8 affine',
    int4_sym:'INT4 symmetric',int4_asym:'INT4 affine',int4_group:'INT4 group-wise',nf4:'NF4 group-wise'},
  group:'Group size',outlier:'Outlier magnitude',smooth:'SmoothQuant channel scaling',alpha:'Migration exponent α',
  decimal:'Input value',numberHint:'Use decimal or scientific notation, signed infinity, or NaN.',
  invalid:'Enter a number, Infinity or NaN.',format:'Inspected format',sqnr:'SQNR (dB)',cosine:'Cosine similarity',
  maxError:'Max absolute error',mse:'Mean squared error',bits:'Effective bits / weight',represented:'Represented value',absolute:'Absolute error',spacing:'ULP',width:'Bit width',
  guides:{
    tensor:'All three matrices share the same selected cell. Step through rows to inspect how neighboring values share a scale. The two injected spikes are in different channels.',
    bits:'Change one bit to inspect the resulting encoding. The stepper selects formats, and each row keeps its own edits. Changing the input value clears bit edits.',
    groups:'A group stores one FP16 scale alongside its codes. Smaller groups often improve reconstruction at the cost of more scale metadata.',
    nf4:'NF4 selects the closest of 16 normal-quantile levels after group normalization. It stores a four-bit lookup index.',
    smooth:'Channel migration divides each column by its own maximum magnitude raised to α. Reconstruction reverses this scaling before measuring error.',
    floating:'Every value passes through the selected floating-point codec. Absolute precision depends on its binade and significand width.',
  },
  missions:{
    outlier:{title:'Witness outlier distortion',description:'Set per-tensor INT4 symmetric quantization with an outlier of at least 15. Bring the full-tensor SQNR below 10 dB.',
      insight:'One extreme value sets the common quantization step. Many ordinary values collapse onto the same few codes.'},
    recovery:{title:'Recover with group-wise NF4',description:'Keep the outlier at 15 or higher. With NF4 and groups of 32 or fewer, reach 18 dB SQNR and cosine similarity of at least 0.99.',
      insight:'Scales from groups without spikes stay small. NF4 places more of its levels near zero, where Gaussian weights concentrate.'},
    exponent:{title:'Flip an exponent bit',description:'Flip a BF16 or FP8 E4M3 exponent bit while both encodings represent nonzero normal numbers.',
      insight:'Changing an exponent bit leaves the significand unchanged. Among normal numbers, the exact value is multiplied by a power of two.'},
  },
} as const
const zh:ExactStringTree<typeof en>={
  presets:{clean:'纯高斯 INT4',outlier:'逐张量离群值压力测试',recovery:'分组 NF4 精度恢复',precision:'BF16 与 FP16 位检查器'},
  mode:'实验视图',modes:{tensor:'张量量化',bits:'IEEE 754 / FP8 位实验室'},
  method:'量化方法',methods:{fp16:'FP16',bf16:'BF16',fp8_e4m3:'FP8 E4M3',int8_sym:'INT8 对称',int8_asym:'INT8 仿射',int4_sym:'INT4 对称',int4_asym:'INT4 仿射',int4_group:'INT4 分组',nf4:'NF4 分组'},
  group:'分组大小',outlier:'离群值幅度',smooth:'SmoothQuant 通道缩放',alpha:'迁移指数 α',decimal:'输入数值',
  numberHint:'可输入十进制、科学计数法、带符号的无穷大或 NaN。',invalid:'请输入数值、Infinity 或 NaN。',
  format:'当前浮点格式',sqnr:'信号量化噪声比（dB）',cosine:'余弦相似度',maxError:'最大绝对误差',mse:'均方误差',bits:'每权重有效位数',
  represented:'表示值',absolute:'绝对误差',spacing:'末位单位 ULP',width:'位宽',
  guides:{
    tensor:'三个矩阵共享同一个选中单元格。通过步进器逐行查看相邻元素如何使用缩放因子。注入的两个尖峰位于不同通道。',
    bits:'翻转任意一位可以检查新的编码。步进器选择格式，各格式分别保存位编辑。输入数值改变时会清除位编辑。',
    groups:'每组除编码外还额外保存一个 FP16 缩放因子。缩小分组通常能改善重建精度，但会增加缩放参数占用。',
    nf4:'NF4 在组内归一化后选取最接近的正态分位数等级，以四位索引表示 16 个等级之一。',
    smooth:'通道迁移将各列除以该列最大绝对值的 α 次方。在测量误差之前，先对重建值撤销这次缩放。',
    floating:'每个数值都通过所选浮点编解码器。绝对精度取决于数值所在的指数区间和尾数位宽。',
  },
  missions:{
    outlier:{title:'观察离群值失真',description:'使用逐张量 INT4 对称量化，将离群值幅度调至至少 15，使全张量信号量化噪声比低于 10 dB。',
      insight:'单个极值决定全张量共享的量化步长。许多普通值因此只能映射到少数几个编码。'},
    recovery:{title:'用分组 NF4 恢复精度',description:'保持离群值幅度至少为 15，使用不超过 32 的 NF4 分组，使信号量化噪声比达到 18 dB、余弦相似度至少达到 0.99。',
      insight:'未包含离群值的组能够保留较小的缩放因子。NF4 在零附近分配更多等级，适合此处集中的高斯权重。'},
    exponent:{title:'翻转浮点指数位',description:'在 BF16 或 FP8 E4M3 中翻转一个指数位，使翻转前后都表示非零的正规数。',
      insight:'改变指数位会保留有效数。对于正规数，此操作会让表示值精确乘以 2 的整数次幂。'},
  },
}
export const quantCopy={en,zh}
