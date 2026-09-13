import { describe, expect, it } from 'vitest'
import { publicUrl } from './publicUrl'

describe('publicUrl', () => {
  it('joins BASE_URL without a double slash', () => {
    expect(publicUrl('resumes/catalog.json')).toBe('/web-cv-generator/resumes/catalog.json')
    expect(publicUrl('/resumes/catalog.json')).toBe('/web-cv-generator/resumes/catalog.json')
  })
})
