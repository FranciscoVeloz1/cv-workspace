import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import minimalResume from '../test/fixtures/minimal-resume.json'
import { resumeSchema } from './resumeSchema'

describe('resumeSchema', () => {
  it('parses the minimal fixture including endDate null', () => {
    const parsed = resumeSchema.safeParse(minimalResume)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.workExperience[0]?.endDate).toBeNull()
    }
  })

  it('allows optional highlights', () => {
    const parsed = resumeSchema.safeParse(minimalResume)
    expect(parsed.success).toBe(true)
  })

  it('parses the synced Francisco resume', () => {
    const json: unknown = JSON.parse(readFileSync('public/resumes/francisco-veloz.json', 'utf8'))
    expect(resumeSchema.safeParse(json).success).toBe(true)
  })
})
