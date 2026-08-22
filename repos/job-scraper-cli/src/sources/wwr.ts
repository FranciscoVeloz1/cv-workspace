import { fetchText } from '../http.js';
import { JobSchema, type Job } from '../schema.js';

const WWR_RSS = 'https://weworkremotely.com/categories/remote-programming-jobs.rss';

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, '$1')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&amp;/gu, '&')
    .trim();
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  if (match?.[1] === undefined) {
    return '';
  }

  return decodeXml(match[1]);
}

export function mapWwrRss(xml: string): Job[] {
  const jobs: Job[] = [];
  const items = xml.split(/<item>/i).slice(1);

  for (const rawItem of items) {
    const block = rawItem.split(/<\/item>/i)[0] ?? rawItem;
    const title = tagValue(block, 'title');
    const link = tagValue(block, 'link');
    const description = tagValue(block, 'description');
    if (title === '' || link === '') {
      continue;
    }

    const colon = title.indexOf(':');
    const company = colon > 0 ? title.slice(0, colon).trim() : 'We Work Remotely';

    const job = JobSchema.safeParse({
      id: link,
      source: 'wwr',
      title,
      company,
      url: link,
      location: 'Remote',
      employment: 'unknown',
      description,
      tags: [],
      salary: null
    });

    if (job.success) {
      jobs.push(job.data);
    }
  }

  return jobs;
}

export async function fetchWwr(): Promise<Job[]> {
  const xml = await fetchText(WWR_RSS, 'wwr');
  return mapWwrRss(xml);
}
