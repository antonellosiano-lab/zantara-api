import { describe, expect, test } from 'vitest';
import { sanitizeInput } from '../helpers/sanitizeInput.js';

describe('sanitizeInput', () => {
  test('removes HTML characters', () => {
    const result = sanitizeInput('<script>alert("x")</script>');
    expect(result).toBe('scriptalert(x)/script');
  });

  test('returns empty string for non-string', () => {
    expect(sanitizeInput(null)).toBe('');
  });
});
