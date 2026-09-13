import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogLoadError } from '../../utils/errors'
import { loadCatalog } from '../../utils/loadCatalog'
import { HomePage } from './index'

vi.mock('../../utils/loadCatalog', () => {
  return {
    loadCatalog: vi.fn()
  }
})

const loadCatalogMock = vi.mocked(loadCatalog)

describe('HomePage', () => {
  beforeEach(() => {
    loadCatalogMock.mockReset()
  })

  it('shows a source card when the catalog is ready', async () => {
    loadCatalogMock.mockResolvedValue({
      resumes: [{ slug: 'francisco-veloz', title: 'Francisco Veloz', subtitle: 'Default full-stack CV' }]
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: 'Resume sources' })).toBeInTheDocument()
    expect(
      screen.getByText('Choose a JSON source of truth. The preview matches the printed page.')
    ).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: 'Francisco Veloz' })
    expect(link.getAttribute('href')).toContain('resume=francisco-veloz')
  })

  it('shows empty copy when the catalog has no sources', async () => {
    loadCatalogMock.mockResolvedValue({ resumes: [] })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(await screen.findByText('No resume sources yet')).toBeInTheDocument()
    expect(
      screen.getByText('Add an entry to public/resumes/catalog.json and a matching JSON file.')
    ).toBeInTheDocument()
  })

  it('shows an error and retries the catalog load', async () => {
    const user = userEvent.setup()
    loadCatalogMock.mockRejectedValueOnce(new CatalogLoadError()).mockResolvedValueOnce({
      resumes: [{ slug: 'francisco-veloz', title: 'Francisco Veloz', subtitle: 'Default full-stack CV' }]
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalog unavailable')
    expect(screen.getByText('Could not load the resume catalog.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(loadCatalogMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByRole('link', { name: 'Francisco Veloz' })).toBeInTheDocument()
  })

  it('shows loading copy without the empty state', () => {
    loadCatalogMock.mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(screen.getByText('Loading resume sources')).toBeInTheDocument()
    expect(screen.getByText('Please wait.')).toBeInTheDocument()
    expect(screen.queryByText('No resume sources yet')).not.toBeInTheDocument()
  })

  it('lets keyboard users activate a source card', async () => {
    const user = userEvent.setup()
    loadCatalogMock.mockResolvedValue({
      resumes: [{ slug: 'francisco-veloz', title: 'Francisco Veloz', subtitle: 'Default full-stack CV' }]
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    const link = await screen.findByRole('link', { name: 'Francisco Veloz' })
    link.focus()
    expect(link).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(link.getAttribute('href')).toContain('resume=francisco-veloz')
    })
  })
})
