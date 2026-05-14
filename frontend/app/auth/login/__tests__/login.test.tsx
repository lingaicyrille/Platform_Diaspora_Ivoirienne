import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../page'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}))

jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}))

const mockedPost = (api as unknown as { post: jest.Mock }).post
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

describe('LoginPage', () => {
  const setAuthMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // useAuthStore is called with a selector: (s) => s.setAuth — return setAuthMock directly
    mockedUseAuthStore.mockReturnValue(setAuthMock as never)
  })

  it('renders the login form', () => {
    render(<LoginPage />)
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByLabelText(/Adresse email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument()
  })

  it('submits credentials and redirects on success', async () => {
    const fakeUser = { id: 1, first_name: 'Kouamé', email: 'k@example.com' }
    mockedPost.mockResolvedValueOnce({
      data: { access: 'access-token', refresh: 'refresh-token', user: fakeUser },
    })

    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/Adresse email/), 'k@example.com')
    await userEvent.type(screen.getByLabelText(/Mot de passe/), 'password123')
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/api/users/login/', {
        email: 'k@example.com',
        password: 'password123',
      })
      expect(setAuthMock).toHaveBeenCalledWith('access-token', 'refresh-token', fakeUser)
      expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message on invalid credentials', async () => {
    mockedPost.mockRejectedValueOnce({
      response: { data: { detail: 'Identifiants invalides.' } },
    })

    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/Adresse email/), 'bad@example.com')
    await userEvent.type(screen.getByLabelText(/Mot de passe/), 'wrongpass')
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides.')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    render(<LoginPage />)
    const input = screen.getByLabelText(/Mot de passe/)
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: /Afficher le mot de passe/ }))
    expect(input).toHaveAttribute('type', 'text')
  })
})
