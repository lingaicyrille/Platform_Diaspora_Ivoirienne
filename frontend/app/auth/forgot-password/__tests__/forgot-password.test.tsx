import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotPasswordPage from '../page'
import api from '@/lib/api'

const backMock = jest.fn()
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: backMock, push: pushMock }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}))

const mockedPost = (api as unknown as { post: jest.Mock }).post

describe('ForgotPasswordPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the form', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Envoyer le lien/ })).toBeInTheDocument()
  })

  it('submits email and shows success state', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} })
    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByPlaceholderText(/vous@exemple/), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /Envoyer le lien/ }))

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/api/users/password-reset/', { email: 'user@example.com' })
      expect(screen.getByText(/Vérifiez votre boîte email/)).toBeInTheDocument()
    })
  })

  it('shows error message on API failure', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByPlaceholderText(/vous@exemple/), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /Envoyer le lien/ }))

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument()
    })
  })

  it('success state shows return to login button', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} })
    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByPlaceholderText(/vous@exemple/), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /Envoyer le lien/ }))

    await waitFor(() => screen.getByText(/Retour à la connexion/))
    await userEvent.click(screen.getByText(/Retour à la connexion/))
    expect(pushMock).toHaveBeenCalledWith('/auth/login')
  })
})
