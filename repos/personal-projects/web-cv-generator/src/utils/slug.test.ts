import { describe, expect, it } from 'vitest'
import { isResumeSlug } from './slug'

describe('isResumeSlug', () => {
  it('rejects path-like slugs', () => {
    expect(isResumeSlug('../etc')).toBe(false)
    expect(isResumeSlug('foo.json')).toBe(false)
    expect(isResumeSlug('francisco-veloz')).toBe(true)
  })

  it('rejects invalid shapes', () => {
    expect(isResumeSlug('Foo')).toBe(false)
    expect(isResumeSlug('a_b')).toBe(false)
    expect(isResumeSlug('')).toBe(false)
    expect(isResumeSlug('a.json')).toBe(false)
  })
})
