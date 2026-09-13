import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResumeNotFoundError } from '../../utils/errors'
import { loadCatalog } from '../../utils/loadCatalog'
import { loadResume } from '../../utils/loadResume'
import { resumeSchema } from '../../utils/resumeSchema'
import minimalResume from '../../test/fixtures/minimal-resume.json'
import { PreviewPage } from './index'

vi.mock('../../utils/loadCatalog', () => {
  return {
    loadCatalog: vi.fn()
  }
})

vi.mock('../../utils/loadResume', () => {
  return {
    loadResume: vi.fn()
  }
})

const loadCatalogMock = vi.mocked(loadCatalog)
const loadResumeMock = vi.mocked(loadResume)

describe('PreviewPage', () => {
  beforeEach(() => {
    loadCatalogMock.mockReset()
    loadResumeMock.mockReset()
  })

  it('renders the sheet and prints from Download PDF', async () => {
    const print = vi.fn()
    window.print = print
    const user = userEvent.setup()
    loadCatalogMock.mockResolvedValue({
      resumes: [{ slug: 'francisco-veloz', title: 'Francisco Veloz', subtitle: 'Default full-stack CV' }]
    })
    loadResumeMock.mockResolvedValue(resumeSchema.parse(minimalResume))

    render(
      <MemoryRouter>
        <PreviewPage slug='francisco-veloz' />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
    const download = screen.getByRole('button', { name: 'Download PDF' })
    expect(download).toBeEnabled()
    await user.click(download)
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('shows not-found and keeps Download PDF disabled', async () => {
    loadCatalogMock.mockResolvedValue({
      resumes: [{ slug: 'francisco-veloz', title: 'Francisco Veloz', subtitle: 'Default full-stack CV' }]
    })
    loadResumeMock.mockRejectedValue(new ResumeNotFoundError({ slug: 'missing-source' }))

    render(
      <MemoryRouter>
        <PreviewPage slug='missing-source' />
      </MemoryRouter>
    )

    expect(await screen.findByText('Resume not found')).toBeInTheDocument()
    expect(screen.getByText('That resume source was not found.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeDisabled()
    const backLinks = screen.getAllByRole('link', { name: 'Back to sources' })
    expect(backLinks.length).toBeGreaterThan(0)
    expect(backLinks[0]).toHaveAttribute('href', '/')
  })
})
