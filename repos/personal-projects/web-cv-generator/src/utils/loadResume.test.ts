import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResumeNotFoundError } from './errors'
import { loadResume } from './loadResume'

describe('loadResume', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not call fetch when the slug is not in the catalog', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const catalog = { resumes: [{ slug: 'francisco-veloz', title: 'F', subtitle: 'S' }] }
    await expect(loadResume('olivia-sanchez', catalog)).rejects.toBeInstanceOf(ResumeNotFoundError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call fetch when the slug is invalid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const catalog = { resumes: [{ slug: 'francisco-veloz', title: 'F', subtitle: 'S' }] }
    await expect(loadResume('../etc', catalog)).rejects.toBeInstanceOf(ResumeNotFoundError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
