import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const bootLoader = document.getElementById('blooddrop-boot-loader')
    if (bootLoader) {
      bootLoader.classList.add('bd-fade-out')
      bootLoader.addEventListener('transitionend', () => {
        bootLoader.remove()
      }, { once: true })
    }
  })
})
