import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StoreProvider } from './store'
import { TweaksProvider } from './tweaks'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter so the built site works from any static host or a local file server. */}
    <HashRouter>
      <TweaksProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </TweaksProvider>
    </HashRouter>
  </StrictMode>,
)
