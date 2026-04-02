import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { HTSProvider } from './state/HTSContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HTSProvider>
      <App />
    </HTSProvider>
  </React.StrictMode>,
)
