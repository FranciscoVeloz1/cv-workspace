import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DownloadPdfButton } from './index'

describe('DownloadPdfButton', () => {
  it('calls onClick when enabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<DownloadPdfButton onClick={onClick} disabled={false} />)
    await user.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<DownloadPdfButton onClick={onClick} disabled={true} />)
    await user.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
