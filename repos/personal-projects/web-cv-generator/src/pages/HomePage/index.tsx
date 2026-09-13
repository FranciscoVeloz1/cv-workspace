import { SourceCard } from '../../components/SourceCard'
import { StatusState } from '../../components/StatusState'
import { useResumeCatalog } from '../../hooks/useResumeCatalog'
import { getErrorMessage } from '../../utils/errors'
import styles from './HomePage.module.css'

export function HomePage() {
  const { status, catalog, error, reload } = useResumeCatalog()
  const sources = catalog?.resumes ?? []

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Resume sources</h1>
      <p className={styles.lede}>Choose a JSON source of truth. The preview matches the printed page.</p>
      {status === 'loading' ? (
        <StatusState tone='info' title='Loading resume sources' body='Please wait.' />
      ) : null}
      {status === 'error' ? (
        <StatusState
          tone='error'
          title='Catalog unavailable'
          body={getErrorMessage(error)}
          action={{ label: 'Try again', onClick: reload }}
        />
      ) : null}
      {status === 'ready' && sources.length === 0 ? (
        <StatusState
          tone='info'
          title='No resume sources yet'
          body='Add an entry to public/resumes/catalog.json and a matching JSON file.'
        />
      ) : null}
      {status === 'ready' && sources.length > 0 ? (
        <ul className={styles.list}>
          {sources.map((entry) => {
            return (
              <SourceCard key={entry.slug} slug={entry.slug} title={entry.title} subtitle={entry.subtitle} />
            )
          })}
        </ul>
      ) : null}
    </main>
  )
}
