import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Service worker precache list', () => {
  it('does not include non-existent script bundle paths', () => {
    const swSource = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf-8');
    expect(swSource).not.toContain('/cadenzio/scripts/app.js');
  });
});
