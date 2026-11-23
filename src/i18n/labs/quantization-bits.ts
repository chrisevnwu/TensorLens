import type { ExactStringTree } from '../types'
const en = {
  title:'Floating-point encodings', help:'Flip a bit to change its stored value. Select a format name to inspect it.',
  sign:'Sign', exponent:'Exponent', mantissa:'Fraction', flip:'Flip', bit:'bit', range:'Representable magnitudes',
  extent:'Each line spans the smallest positive subnormal to the largest finite value. The dot marks the magnitude after your edits.',
  input:'Input value', base:'Rounded input', value:'Decoded value', error:'Absolute error', ulp:'Spacing (ULP)',
  bias:'Exponent bias', min:'Smallest positive subnormal', normal:'Smallest positive normal', max:'Largest finite value',
  category:'Number class', normalClass:'Normal', subnormal:'Subnormal', zero:'Zero', inf:'Infinity', nan:'NaN', unavailable:'Undefined',
} as const
const zh:ExactStringTree<typeof en> = {
  title:'浮点数的二进制编码', help:'点击位方格可翻转该位，点击格式名称可查看详细数值。',
  sign:'符号', exponent:'指数', mantissa:'尾数', flip:'翻转', bit:'位', range:'可表示数值的绝对值范围',
  extent:'线段两端分别是最小正次正规数和最大有限值。圆点表示编辑后数值的绝对值。',
  input:'输入值', base:'舍入后的输入', value:'解码值', error:'绝对误差', ulp:'相邻间距（ULP）',
  bias:'指数偏置', min:'最小正次正规数', normal:'最小正正规数', max:'最大有限值',
  category:'数值类别', normalClass:'正规数', subnormal:'次正规数', zero:'零', inf:'无穷大', nan:'非数（NaN）', unavailable:'无定义',
}
export const bitCopy={en,zh}
