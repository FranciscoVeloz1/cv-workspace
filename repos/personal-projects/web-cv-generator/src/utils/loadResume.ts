import type { Catalog } from '../types/catalog'
import { ResumeNetworkError, ResumeNotFoundError, ResumeValidationError } from './errors'
import { publicUrl } from './publicUrl'
import { resumeSchema, type Resume } from './resumeSchema'
import { isResumeSlug } from './slug'

export async function loadResume(slug: string, catalog: Catalog): Promise<Resume> {
  if (!isResumeSlug(slug)) {
    throw new ResumeNotFoundError({ slug })
  }

  const allowed = catalog.resumes.some((entry) => {
    return entry.slug === slug
  })
  if (!allowed) {
    throw new ResumeNotFoundError({ slug })
  }

  let response: Response
  try {
    response = await fetch(publicUrl(`resumes/${slug}.json`))
  } catch (error: unknown) {
    throw new ResumeNetworkError(undefined, { cause: error instanceof Error ? error : undefined })
  }

  if (response.status === 404) {
    throw new ResumeNotFoundError({ slug, status: 404 })
  }
  if (!response.ok) {
    throw new ResumeNetworkError({ status: response.status })
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new ResumeValidationError(['$'])
  }

  const parsed = resumeSchema.safeParse(json)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      return issue.path.join('.')
    })
    throw new ResumeValidationError(issues)
  }

  return parsed.data
}
