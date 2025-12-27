import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

import { WalletProvider } from './contexts/WalletContext'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
)
