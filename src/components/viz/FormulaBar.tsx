import { useMemo } from 'react'
import katex from 'katex'
import { useI18n } from '../../i18n'
import { visuals } from '../../i18n/visuals'

export function FormulaBar({ tex }: { tex: string }) {
  const { locale } = useI18n()
  const rendered = useMemo(() => katex.renderToString(tex, { throwOnError: false, trust:false, output:'htmlAndMathml' }), [tex])
  return <div className="formula-bar" aria-label={visuals[locale].equation} dangerouslySetInnerHTML={{ __html: rendered }} />
}
