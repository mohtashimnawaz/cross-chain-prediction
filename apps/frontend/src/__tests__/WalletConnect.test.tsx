import React from 'react'
import { render, screen } from '@testing-library/react'
import { WalletProvider } from '../contexts/WalletContext'
import WalletConnect from '../components/WalletConnect'

describe('WalletConnect', () => {
  it('renders connect buttons', () => {
    render(
      <WalletProvider>
        <WalletConnect />
      </WalletProvider>
    )

    expect(screen.getByText(/Connect MetaMask/i)).toBeInTheDocument()
    expect(screen.getByText(/Connect Phantom/i)).toBeInTheDocument()
  })
})
