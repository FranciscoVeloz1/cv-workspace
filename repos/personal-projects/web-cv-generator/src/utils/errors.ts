export class ApplicationError extends Error {
  readonly timestamp = new Date().toISOString()

  constructor(
    message: string,
    readonly code: string,
    readonly details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = this.constructor.name
    const errorConstructor = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: typeof ApplicationError) => void
    }
    if (errorConstructor.captureStackTrace) {
      errorConstructor.captureStackTrace(this, this.constructor as typeof ApplicationError)
    }
  }
}

export class CatalogLoadError extends ApplicationError {
  constructor(details?: Record<string, unknown>, options?: ErrorOptions) {
    super('Could not load the resume catalog.', 'CATALOG_LOAD', details, options)
  }
}

export class ResumeNotFoundError extends ApplicationError {
  constructor(details?: Record<string, unknown>) {
    super('That resume source was not found.', 'RESUME_NOT_FOUND', details)
  }
}

export class ResumeValidationError extends ApplicationError {
  constructor(issues: string[]) {
    super('That resume file is not valid.', 'RESUME_VALIDATION', { issues })
  }
}

export class ResumeNetworkError extends ApplicationError {
  constructor(details?: Record<string, unknown>, options?: ErrorOptions) {
    super(
      'Could not load that resume. Check your connection and try again.',
      'RESUME_NETWORK',
      details,
      options
    )
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Something went wrong.'
}
