import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useAppStore } from './store/useAppStore'

function applyPreferences({ theme, locale }: ReturnType<typeof useAppStore.getState>) {
  document.documentElement.dataset.theme = theme
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
}

applyPreferences(useAppStore.getState())
useAppStore.subscribe(applyPreferences)

const root = document.getElementById('root')
if (!root) throw new Error('Missing application mount point')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
