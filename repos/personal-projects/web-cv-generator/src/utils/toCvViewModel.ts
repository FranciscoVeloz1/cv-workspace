import type { CvViewModel } from '../types/cvViewModel'
import type { Resume } from './resumeSchema'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }
  return trimmed
}

export function toCvViewModel(resume: Resume): CvViewModel {
  const contactParts = [resume.profile.email, resume.profile.phone, resume.profile.location, resume.profile.website]
    .map((part) => {
      return part.trim()
    })
    .filter((part) => {
      return part.length > 0
    })

  const longSummary = emptyToNull(resume.summary.long)
  const shortSummary = emptyToNull(resume.summary.short)

  return {
    fullName: resume.profile.fullName.trim(),
    headline: emptyToNull(resume.profile.headline),
    contactLine: contactParts.length > 0 ? contactParts.join(' | ') : null,
    summary: longSummary !== null ? longSummary : shortSummary,
    experience: resume.workExperience.map((job) => {
      return {
        heading: `${job.position.trim()}, ${job.company.trim()}`,
        dates: job.duration.trim(),
        bullets: job.responsibilities
          .map((item) => {
            return item.trim()
          })
          .filter((item) => {
            return item.length > 0
          })
      }
    }),
    education: resume.education.map((item) => {
      return {
        heading: item.degree.trim(),
        institution: item.institution.trim(),
        dates: item.duration.trim()
      }
    }),
    skillNames: resume.skills
      .map((skill) => {
        return skill.name.trim()
      })
      .filter((name) => {
        return name.length > 0
      })
  }
}
