import type { ReactNode } from 'react'
import { A4Stage } from '../../components/A4Stage'
import { AppChrome } from '../../components/AppChrome'
import { CvDocument } from '../../components/CvDocument'
import { PreviewError } from '../../components/PreviewError'
import { StatusState } from '../../components/StatusState'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { usePrintCv } from '../../hooks/usePrintCv'
import { useResumeSource } from '../../hooks/useResumeSource'
import styles from './PreviewPage.module.css'

type PreviewPageProps = {
  slug: string
}

export function PreviewPage({ slug }: PreviewPageProps) {
  const { status, catalog, viewModel, error, reload } = useResumeSource(slug)
  const { printCv } = usePrintCv()
  const sourceTitle =
    catalog?.resumes.find((entry) => {
      return entry.slug === slug
    })?.title ?? slug

  useDocumentTitle(status === 'ready' && viewModel !== undefined ? `${viewModel.fullName} – CV` : null)

  let body: ReactNode = null
  if (status === 'loading') {
    body = (
      <div className={styles.status}>
        <StatusState tone='info' title='Loading resume' body='Please wait.' />
      </div>
    )
  } else if (status === 'error') {
    body = (
      <div className={styles.status}>
        <PreviewError error={error} onRetry={reload} />
      </div>
    )
  } else if (viewModel !== undefined) {
    body = (
      <A4Stage>
        <CvDocument cv={viewModel} />
      </A4Stage>
    )
  }

  return (
    <AppChrome
      backTo='/'
      backLabel='Back to sources'
      sourceTitle={sourceTitle}
      onDownload={printCv}
      downloadDisabled={status !== 'ready'}
    >
      {body}
    </AppChrome>
  )
}
