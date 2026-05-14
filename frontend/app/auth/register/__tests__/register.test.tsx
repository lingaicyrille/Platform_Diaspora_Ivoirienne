import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '../page'
import api from '@/lib/api'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}))

const pushMock = jest.fn()
const mockedPost = (api as unknown as { post: jest.Mock }).post

// Helpers — all use userEvent so React state flushes correctly
async function fillStep1(firstName = 'Kouamé', lastName = 'Diallo') {
  await userEvent.type(screen.getByLabelText(/Prénom/), firstName)
  await userEvent.type(screen.getByLabelText(/^Nom/), lastName)
}

async function clickContinuer() {
  await userEvent.click(screen.getByRole('button', { name: /Continuer/ }))
}

async function goToStep2() {
  await fillStep1()
  await clickContinuer()
  await waitFor(() => screen.getByText('Votre localisation'))
}

async function goToStep3() {
  await goToStep2()
  await clickContinuer()
  await waitFor(() => screen.getByText('Créer votre compte'))
}

async function fillStep3(
  email = 'test@example.com',
  password = 'password123',
  confirm = 'password123',
) {
  await userEvent.type(screen.getByLabelText(/Adresse email/), email)
  await userEvent.type(screen.getByLabelText(/^Mot de passe \*/), password)
  await userEvent.type(screen.getByLabelText(/Confirmer/), confirm)
}

describe('RegisterPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders step 1 by default', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Votre identité')).toBeInTheDocument()
    expect(screen.getByText(/Étape 1 sur 3/)).toBeInTheDocument()
  })

  it('shows error when first name and last name are empty', async () => {
    render(<RegisterPage />)
    await clickContinuer()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Prénom et nom sont requis.')
    })
  })

  it('advances to step 2 when step 1 is valid', async () => {
    render(<RegisterPage />)
    await goToStep2()
    expect(screen.getByText('Votre localisation')).toBeInTheDocument()
  })

  it('advances to step 3 from step 2', async () => {
    render(<RegisterPage />)
    await goToStep3()
    expect(screen.getByText('Créer votre compte')).toBeInTheDocument()
  })

  it('shows password mismatch error on step 3', async () => {
    render(<RegisterPage />)
    await goToStep3()
    await fillStep3('test@example.com', 'password123', 'different123')
    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Les mots de passe ne correspondent pas.')
    })
  })

  it('shows error when password is too short', async () => {
    render(<RegisterPage />)
    await goToStep3()
    await fillStep3('test@example.com', '123', '123')
    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('au moins 8 caractères')
    })
  })

  it('submits and redirects to login on success', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} })
    render(<RegisterPage />)
    await goToStep3()
    await fillStep3()
    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))
    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/api/users/register/',
        expect.objectContaining({ email: 'test@example.com', first_name: 'Kouamé', last_name: 'Diallo' }),
      )
      expect(pushMock).toHaveBeenCalledWith('/auth/login?registered=1')
    })
  })

  it('shows server error message on API failure', async () => {
    mockedPost.mockRejectedValueOnce({
      response: { data: { email: ['Un compte avec cet email existe déjà.'] } },
    })
    render(<RegisterPage />)
    await goToStep3()
    await fillStep3('exists@example.com')
    await userEvent.click(screen.getByRole('button', { name: /Créer mon compte/ }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Un compte avec cet email existe déjà.')
    })
  })

  it('back button returns to previous step', async () => {
    render(<RegisterPage />)
    await goToStep2()
    await userEvent.click(screen.getByRole('button', { name: /Retour/ }))
    await waitFor(() => {
      expect(screen.getByText('Votre identité')).toBeInTheDocument()
    })
  })
})
