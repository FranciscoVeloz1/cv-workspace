import { useCallback, useEffect, useState } from 'react'
import type { Catalog } from '../types/catalog'
import { loadCatalog } from '../utils/loadCatalog'

export type CatalogState = {
  status: 'loading' | 'ready' | 'error'
  catalog?: Catalog
  error?: unknown
  reload: () => void
}

type CatalogResult = {
  loadCount: number
  status: 'ready' | 'error'
  catalog?: Catalog
  error?: unknown
}

export function useResumeCatalog(): CatalogState {
  const [loadCount, setLoadCount] = useState(0)
  const [result, setResult] = useState<CatalogResult | null>(null)

  const reload = useCallback(() => {
    setLoadCount((count) => {
      return count + 1
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    void loadCatalog()
      .then((data) => {
        if (cancelled) {
          return
        }
        setResult({ loadCount, status: 'ready', catalog: data, error: undefined })
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return
        }
        setResult({ loadCount, status: 'error', catalog: undefined, error: caught })
      })

    return () => {
      cancelled = true
    }
  }, [loadCount])

  const isCurrent = result !== null && result.loadCount === loadCount
  const status: CatalogState['status'] = isCurrent ? result.status : 'loading'
  const catalog = isCurrent ? result.catalog : undefined
  const error = isCurrent ? result.error : undefined

  return { status, catalog, error, reload }
}
