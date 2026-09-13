import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import franciscoJson from '../../../public/resumes/francisco-veloz.json'
import { oliviaViewModel } from '../../test/fixtures/olivia-view-model'
import type { CvViewModel } from '../../types/cvViewModel'
import { resumeSchema } from '../../utils/resumeSchema'
import { toCvViewModel } from '../../utils/toCvViewModel'
import { CvDocument } from './index'

describe('CvDocument', () => {
  it('renders the Olivia fixture structure', () => {
    render(<CvDocument cv={oliviaViewModel} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Olivia Sanchez' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /summary/i })).toBeInTheDocument()
    expect(screen.getByText(/Arowwai Industries/)).toBeInTheDocument()
    expect(screen.getByText('University of Business Excellence')).toBeInTheDocument()
    expect(screen.getByText('Client Acquisition')).toBeInTheDocument()
  })

  it('omits empty optional sections and keeps the name', () => {
    const empty: CvViewModel = {
      fullName: 'Ada Lovelace',
      headline: null,
      contactLine: null,
      summary: null,
      experience: [],
      education: [],
      skillNames: []
    }
    render(<CvDocument cv={empty} />)
    expect(screen.queryByRole('heading', { name: /summary/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /work experience/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /education/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /key skills/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
  })

  it('renders the synced Francisco resume jobs', () => {
    const francisco = resumeSchema.parse(franciscoJson)
    render(<CvDocument cv={toCvViewModel(francisco)} />)
    expect(screen.getByRole('heading', { level: 1, name: /Francisco/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
      francisco.workExperience.length + francisco.education.length
    )
  })

  it('keeps skill names in JSON order', () => {
    render(<CvDocument cv={oliviaViewModel} />)
    const items = screen.getAllByRole('listitem').map((item) => {
      return item.textContent
    })
    const firstSkillIndex = items.indexOf('Client Acquisition')
    expect(firstSkillIndex).toBeGreaterThanOrEqual(0)
    expect(items[firstSkillIndex]).toBe('Client Acquisition')
    expect(items[firstSkillIndex + 1]).toBe('B2B Sales')
  })
})
