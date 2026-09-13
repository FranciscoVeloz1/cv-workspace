import { describe, expect, it } from 'vitest'
import minimalResume from '../test/fixtures/minimal-resume.json'
import { resumeSchema } from './resumeSchema'
import { toCvViewModel } from './toCvViewModel'

describe('toCvViewModel', () => {
  it('prefers long summary and drops empty contact fields', () => {
    const parsed = resumeSchema.parse(minimalResume)
    const viewModel = toCvViewModel(parsed)

    expect(viewModel.summary).toBe('Longer summary that must win.')
    expect(viewModel.contactLine).toBe('ada@example.com | London')
    expect(viewModel.fullName).toBe('Ada Lovelace')
    expect(viewModel.headline).toBe('Analyst')
    expect(viewModel.skillNames).toEqual(['Mathematics', 'Writing'])
  })

  it('omits empty work experience after mapping', () => {
    const parsed = resumeSchema.parse({
      ...minimalResume,
      workExperience: []
    })
    const viewModel = toCvViewModel(parsed)
    expect(viewModel.experience).toEqual([])
  })
})
