import { afterAll } from 'vitest';
import { results } from './utils/requestTimer.js';
import { writeFileSync } from 'node:fs';

afterAll(() => {
  console.table(results);
  writeFileSync('request-times.json', JSON.stringify(results, null, 2));
});
