import {
  CatalogLoadError,
  ResumeNetworkError,
  ResumeNotFoundError,
  ResumeValidationError,
  getErrorMessage
} from '../../utils/errors'
import { StatusState } from '../StatusState'

type PreviewErrorProps = {
  error: unknown
  onRetry: () => void
}

export function PreviewError({ error, onRetry }: PreviewErrorProps) {
  if (error instanceof ResumeNotFoundError) {
    return (
      <StatusState
        tone='error'
        title='Resume not found'
        body={getErrorMessage(error)}
        action={{ label: 'Back to sources', href: '/' }}
      />
    )
  }
  if (error instanceof ResumeValidationError) {
    return (
      <StatusState
        tone='error'
        title='Invalid resume file'
        body={getErrorMessage(error)}
        action={{ label: 'Back to sources', href: '/' }}
      />
    )
  }
  if (error instanceof CatalogLoadError) {
    return (
      <StatusState
        tone='error'
        title='Catalog unavailable'
        body={getErrorMessage(error)}
        action={{ label: 'Try again', onClick: onRetry }}
      />
    )
  }
  if (error instanceof ResumeNetworkError) {
    return (
      <StatusState
        tone='error'
        title='Could not load resume'
        body={getErrorMessage(error)}
        action={{ label: 'Try again', onClick: onRetry }}
      />
    )
  }
  return (
    <StatusState
      tone='error'
      title='Could not load resume'
      body={getErrorMessage(error)}
      action={{ label: 'Try again', onClick: onRetry }}
    />
  )
}
