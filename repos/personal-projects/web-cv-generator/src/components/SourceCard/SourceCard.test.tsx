import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SourceCard } from './index'

describe('SourceCard', () => {
  it('links to the resume query for the slug', () => {
    render(
      <MemoryRouter>
        <ul>
          <SourceCard slug='francisco-veloz' title='Francisco Veloz' subtitle='Default full-stack CV' />
        </ul>
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Francisco Veloz' })
    expect(link.getAttribute('href')).toContain('resume=francisco-veloz')
  })
})
