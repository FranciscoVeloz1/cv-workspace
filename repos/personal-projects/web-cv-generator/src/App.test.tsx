import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('shows the catalog heading when resume is absent', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Resume sources' })).toBeInTheDocument()
  })

  it('shows preview when resume query is set', async () => {
    render(
      <MemoryRouter initialEntries={['/?resume=francisco-veloz']}>
        <App />
      </MemoryRouter>
    )
    expect(await screen.findByRole('link', { name: 'Back to sources' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
  })

  it('treats empty resume as home', () => {
    render(
      <MemoryRouter initialEntries={['/?resume=']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Resume sources' })).toBeInTheDocument()
  })
})
