import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DownloadPdfButton } from '../DownloadPdfButton'
import styles from './AppChrome.module.css'

type AppChromeProps = {
  backTo: string
  backLabel: string
  sourceTitle: string
  onDownload: () => void
  downloadDisabled: boolean
  children: ReactNode
}

export function AppChrome({
  backTo,
  backLabel,
  sourceTitle,
  onDownload,
  downloadDisabled,
  children
}: AppChromeProps) {
  return (
    <div className={`app-shell ${styles.shell}`}>
      <header className={`no-print ${styles.header}`} role='banner'>
        <Link className={styles.back} to={backTo} aria-label={backLabel}>
          {backLabel}
        </Link>
        <p className={styles.source}>{sourceTitle}</p>
        <DownloadPdfButton onClick={onDownload} disabled={downloadDisabled} />
      </header>
      <main className={`preview-stage ${styles.stage}`}>{children}</main>
    </div>
  )
}
