import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { CliError } from './errors.js';

const ResumeSkillsSchema = z
  .object({
    skills: z.array(z.object({ name: z.string() }))
  })
  .passthrough();

export function defaultResumePath(): string {
  return fileURLToPath(new URL('../../resume-data-source/index.json', import.meta.url));
}

export async function loadSkillNames(resumePath: string): Promise<string[]> {
  let raw: string;
  try {
    raw = await readFile(resumePath, 'utf8');
  } catch {
    throw new CliError('RESUME_NOT_FOUND', `Resume file not found: ${resumePath}`, 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CliError('RESUME_INVALID', `Resume file is not valid JSON: ${resumePath}`, 1);
  }

  const result = ResumeSkillsSchema.safeParse(parsed);
  if (!result.success) {
    throw new CliError('RESUME_INVALID', `Resume file is missing skills: ${resumePath}`, 1);
  }

  if (result.data.skills.length === 0) {
    throw new CliError('RESUME_EMPTY', `Resume file has no skills: ${resumePath}`, 1);
  }

  return result.data.skills.map((skill) => {
    return skill.name;
  });
}
