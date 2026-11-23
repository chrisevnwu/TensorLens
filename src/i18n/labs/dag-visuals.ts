import type { ExactStringTree } from '../types'
const en={
  title:'Reverse-mode computation graph',help:'Read forward values from left to right. Each reverse step adds one node’s gradient contributions to its parents.',
  swipe:'Scroll the graph horizontally to follow the full circuit.',seed:'Seed the loss gradient',active:'Reverse step',value:'Value',gradient:'Accumulated gradient',
  partial:'Local derivative',incoming:'Contribution',parent:'Parent',checks:'Gradient check at the end of backpropagation',analytical:'Autograd',central:'Central difference',
  kink:'The difference interval crosses the ReLU kink. Its slope can differ from the chosen subgradient.',error:'Absolute error',quantity:'Variable',
  op:{input:'Input',param:'Parameter',add:'Add',sub:'Subtract',mul:'Multiply',div:'Divide',pow:'Power',exp:'Exponential',log:'Logarithm',relu:'ReLU',gelu:'GELU',tanh:'tanh',sigmoid:'Sigmoid'},
} as const
const zh:ExactStringTree<typeof en>={
  title:'反向模式计算图',help:'从左往右查看前向数值。每个反向步骤把一个节点的梯度贡献分别累加到其父节点。',
  swipe:'横向滚动可查看完整计算图。',seed:'初始化损失梯度',active:'反向步骤',value:'前向值',gradient:'已累积梯度',
  partial:'局部导数',incoming:'梯度贡献',parent:'父节点',checks:'反向传播结束时的梯度校验',analytical:'自动微分',central:'中心差分',
  kink:'差分区间跨越了 ReLU 的折点，测得的斜率可能与选用的次梯度不同。',error:'绝对误差',quantity:'变量',
  op:{input:'输入',param:'参数',add:'加法',sub:'减法',mul:'乘法',div:'除法',pow:'乘方',exp:'指数',log:'对数',relu:'ReLU',gelu:'GELU',tanh:'双曲正切',sigmoid:'Sigmoid'},
}
export const dagCopy={en,zh}
