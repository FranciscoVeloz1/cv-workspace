import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppChrome } from './index'

describe('AppChrome', () => {
  it('marks the toolbar as no-print', () => {
    const onDownload = vi.fn()
    render(
      <MemoryRouter>
        <AppChrome
          backTo='/'
          backLabel='Back to sources'
          sourceTitle='Francisco Veloz'
          onDownload={onDownload}
          downloadDisabled={false}
        >
          <p>stage</p>
        </AppChrome>
      </MemoryRouter>
    )

    const header = screen.getByRole('banner')
    expect(header.className.split(' ')).toContain('no-print')
    expect(header.parentElement?.className.split(' ')).toContain('app-shell')
    expect(screen.getByRole('main').className.split(' ')).toContain('preview-stage')
    expect(screen.getByRole('link', { name: 'Back to sources' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeEnabled()
  })
})
