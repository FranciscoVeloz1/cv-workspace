import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { CliError } from './errors.js';
import { loadSkillNames } from './resume.js';

describe('loadSkillNames', () => {
  it('returns skill names from index.json', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'resume-'));
    const path = join(dir, 'index.json');
    writeFileSync(
      path,
      JSON.stringify({
        skills: [
          { id: 1, name: 'React' },
          { id: 2, name: 'Node.js' }
        ]
      })
    );

    const names = await loadSkillNames(path);
    assert.deepEqual(names, ['React', 'Node.js']);
  });

  it('throws RESUME_NOT_FOUND when the file is missing', async () => {
    await assert.rejects(
      () => loadSkillNames('/tmp/job-scraper-missing-resume-does-not-exist.json'),
      (error: unknown) => {
        assert.ok(error instanceof CliError);
        assert.equal(error.code, 'RESUME_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws RESUME_EMPTY when skills is an empty array', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'resume-empty-'));
    const path = join(dir, 'index.json');
    writeFileSync(path, JSON.stringify({ skills: [] }));

    await assert.rejects(
      () => loadSkillNames(path),
      (error: unknown) => {
        assert.ok(error instanceof CliError);
        assert.equal(error.code, 'RESUME_EMPTY');
        return true;
      }
    );
  });
});
