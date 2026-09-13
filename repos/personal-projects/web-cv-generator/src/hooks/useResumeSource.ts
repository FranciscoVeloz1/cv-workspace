import { useCallback, useEffect, useState } from 'react'
import type { Catalog } from '../types/catalog'
import type { CvViewModel } from '../types/cvViewModel'
import { loadCatalog } from '../utils/loadCatalog'
import { loadResume } from '../utils/loadResume'
import type { Resume } from '../utils/resumeSchema'
import { toCvViewModel } from '../utils/toCvViewModel'

export type ResumeSourceState = {
  status: 'loading' | 'ready' | 'error'
  catalog?: Catalog
  resume?: Resume
  viewModel?: CvViewModel
  error?: unknown
  reload: () => void
}

type ResumeResult = {
  slug: string
  loadCount: number
  status: 'ready' | 'error'
  catalog?: Catalog
  resume?: Resume
  viewModel?: CvViewModel
  error?: unknown
}

export function useResumeSource(slug: string): ResumeSourceState {
  const [loadCount, setLoadCount] = useState(0)
  const [result, setResult] = useState<ResumeResult | null>(null)

  const reload = useCallback(() => {
    setLoadCount((count) => {
      return count + 1
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    void loadCatalog()
      .then((loadedCatalog) => {
        if (cancelled) {
          return Promise.resolve()
        }
        return loadResume(slug, loadedCatalog)
          .then((loadedResume) => {
            if (cancelled) {
              return
            }
            setResult({
              slug,
              loadCount,
              status: 'ready',
              catalog: loadedCatalog,
              resume: loadedResume,
              viewModel: toCvViewModel(loadedResume),
              error: undefined
            })
          })
          .catch((caught: unknown) => {
            if (cancelled) {
              return
            }
            setResult({
              slug,
              loadCount,
              status: 'error',
              catalog: loadedCatalog,
              resume: undefined,
              viewModel: undefined,
              error: caught
            })
          })
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return
        }
        setResult({
          slug,
          loadCount,
          status: 'error',
          catalog: undefined,
          resume: undefined,
          viewModel: undefined,
          error: caught
        })
      })

    return () => {
      cancelled = true
    }
  }, [slug, loadCount])

  const isCurrent = result !== null && result.slug === slug && result.loadCount === loadCount
  const status: ResumeSourceState['status'] = isCurrent ? result.status : 'loading'
  const catalog = isCurrent ? result.catalog : undefined
  const resume = isCurrent ? result.resume : undefined
  const viewModel = isCurrent ? result.viewModel : undefined
  const error = isCurrent ? result.error : undefined

  return { status, catalog, resume, viewModel, error, reload }
}
