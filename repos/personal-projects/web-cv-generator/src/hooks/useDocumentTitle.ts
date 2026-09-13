import { useEffect } from 'react'

const DEFAULT_TITLE = 'CV Generator'

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    const previous = document.title
    if (title !== null) {
      document.title = title
    }
    return () => {
      document.title = previous.length > 0 ? previous : DEFAULT_TITLE
    }
  }, [title])
}
