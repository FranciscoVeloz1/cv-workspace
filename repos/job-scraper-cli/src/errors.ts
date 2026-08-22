export class CliError extends Error {
  readonly code: string;
  readonly exitCode: number;

  constructor(code: string, message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

export class SourceError extends Error {
  readonly source: string;
  readonly status?: number;

  constructor(source: string, message: string, status?: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SourceError';
    this.source = source;
    this.status = status;
  }
}
