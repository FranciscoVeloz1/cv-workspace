import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StatusState } from './index'

describe('StatusState', () => {
  it('uses status role for info tone', () => {
    render(<StatusState tone='info' title='Loading resume sources' body='Please wait.' />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading resume sources')
  })

  it('uses alert role for error tone and retries with a button', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StatusState
          tone='error'
          title='Catalog unavailable'
          body='Could not load the resume catalog.'
          action={{ label: 'Try again', onClick }}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Catalog unavailable')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a link when action.href is set', () => {
    render(
      <MemoryRouter>
        <StatusState
          tone='info'
          title='That resume source was not found.'
          body='Pick another source from the catalog.'
          action={{ label: 'Back to catalog', href: '/' }}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Back to catalog' })).toHaveAttribute('href', '/')
  })
})
