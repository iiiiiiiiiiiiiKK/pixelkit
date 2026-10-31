import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './App'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './theme'
import { WorkspaceProvider } from './workspace/store'

const container = document.getElementById('root')
if (!container) throw new Error('Root container missing in index.html')

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
