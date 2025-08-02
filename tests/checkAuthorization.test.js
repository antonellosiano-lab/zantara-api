import { describe, expect, test } from 'vitest';
import { checkAuthorization } from '../helpers/checkAuthorization.js';

describe('checkAuthorization', () => {
  test('accepts valid token', () => {
    process.env.ZANTARA_SECRET_KEY = 'secret';
    const req = { headers: { authorization: 'Bearer secret' } };
    expect(checkAuthorization(req)).toBe(true);
  });

  test('rejects invalid token', () => {
    process.env.ZANTARA_SECRET_KEY = 'secret';
    const req = { headers: { authorization: 'Bearer wrong' } };
    expect(checkAuthorization(req)).toBe(false);
  });
});
