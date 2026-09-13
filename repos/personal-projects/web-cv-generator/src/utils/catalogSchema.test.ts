import { describe, expect, it } from 'vitest'
import { catalogSchema } from './catalogSchema'

describe('catalogSchema', () => {
  it('accepts an empty resume list', () => {
    const parsed = catalogSchema.safeParse({ resumes: [] })
    expect(parsed.success).toBe(true)
  })

  it('rejects duplicate slugs', () => {
    const parsed = catalogSchema.safeParse({
      resumes: [
        { slug: 'francisco-veloz', title: 'Francisco Veloz', subtitle: 'Default full-stack CV' },
        { slug: 'francisco-veloz', title: 'Copy', subtitle: 'Duplicate' }
      ]
    })
    expect(parsed.success).toBe(false)
  })
})
