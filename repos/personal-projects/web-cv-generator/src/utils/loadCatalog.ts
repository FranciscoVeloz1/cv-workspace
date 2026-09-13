import type { Catalog } from '../types/catalog'
import { catalogSchema } from './catalogSchema'
import { CatalogLoadError } from './errors'
import { publicUrl } from './publicUrl'

function issuePaths(error: { issues: { path: (string | number)[] }[] }): string[] {
  return error.issues.map((issue) => {
    return issue.path.join('.')
  })
}

export async function loadCatalog(): Promise<Catalog> {
  let response: Response
  try {
    response = await fetch(publicUrl('resumes/catalog.json'))
  } catch (error: unknown) {
    throw new CatalogLoadError(undefined, { cause: error instanceof Error ? error : undefined })
  }

  if (!response.ok) {
    throw new CatalogLoadError({ status: response.status })
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (error: unknown) {
    throw new CatalogLoadError(undefined, { cause: error instanceof Error ? error : undefined })
  }

  const parsed = catalogSchema.safeParse(json)
  if (!parsed.success) {
    throw new CatalogLoadError({ issues: issuePaths(parsed.error) })
  }

  return parsed.data
}
