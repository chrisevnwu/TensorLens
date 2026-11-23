import { useMemo } from 'react'
import katex from 'katex'
import { useI18n } from '../../i18n'
import { visuals } from '../../i18n/visuals'

// KaTeX uses legacy MathML variants for these symbols. MathML Core encodes
// their mathematical meaning in Unicode. Keep the visual HTML and TeX annotation.
function renderFormula(tex: string) {
  return katex.renderToString(tex, { throwOnError: false, trust: false, output: 'htmlAndMathml' })
    .replaceAll('<mi mathvariant="double-struck">R</mi>', '<mi>ℝ</mi>')
    .replaceAll('<mi mathvariant="script">L</mi>', '<mi>ℒ</mi>')
    .replaceAll('<mi mathvariant="script">N</mi>', '<mi>𝒩</mi>')
    .replaceAll('<mn mathvariant="bold">1</mn>', '<mn>𝟏</mn>')
}

export function FormulaBar({ tex }: { tex: string }) {
  const { locale } = useI18n()
  const rendered = useMemo(() => renderFormula(tex), [tex])
  return <div className="formula-bar" aria-label={visuals[locale].equation} dangerouslySetInnerHTML={{ __html: rendered }} />
}
