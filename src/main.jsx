import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ToastProvider from './components/ToastProvider'
import './styles.css'
import './registerServiceWorker'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <React.Suspense fallback={null}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </React.Suspense>
    </BrowserRouter>
  </React.StrictMode>
)
