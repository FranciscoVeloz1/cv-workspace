import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './index.css'

function getRouterBasename(): string {
  const base = import.meta.env.BASE_URL
  if (base === '/') {
    return '/'
  }
  return base.endsWith('/') ? base : `${base}/`
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
