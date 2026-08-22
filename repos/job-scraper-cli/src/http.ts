import { SourceError } from './errors.js';

const USER_AGENT = 'JobScraperCli/0.1 (+https://franciscoveloz1.github.io/portfolio/)';

export async function fetchText(url: string, source: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/json, application/rss+xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(15_000)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network failure';
    throw new SourceError(source, message, undefined, { cause: error });
  }

  if (!res.ok) {
    throw new SourceError(source, `HTTP ${res.status}`, res.status);
  }

  return res.text();
}

export async function fetchJson<T>(url: string, source: string): Promise<T> {
  const text = await fetchText(url, source);
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new SourceError(source, 'Invalid JSON', undefined, { cause: error });
  }
}
