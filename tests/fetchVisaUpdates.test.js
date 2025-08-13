import { describe, it, expect, vi, beforeEach } from 'vitest';
import Ajv from 'ajv';
import { fetchVisaUpdates } from '../lib/fetchVisaUpdates.js';

const ajv = new Ajv();

const updateSchema = {
  type: 'object',
  required: ['visa_type', 'summary', 'updated_at'],
  properties: {
    visa_type: { type: 'string' },
    summary: { type: 'string' },
    updated_at: { type: 'string' }
  }
};

const validate = ajv.compile(updateSchema);

describe('fetchVisaUpdates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.VISA_UPDATES_URL = 'https://api.example.com/updates';
  });

  it('gets updates without filter', async () => {
    const sample = [
      { visa_type: 'A', summary: 'Alpha', updated_at: '2024-01-01' },
      { visa_type: 'B', summary: 'Beta', updated_at: '2024-02-01' }
    ];
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => sample
    });

    const { status, data } = await fetchVisaUpdates();
    expect(status).toBe(200);
    data.forEach(item => expect(validate(item)).toBe(true));
  });

  it('gets updates filtered by visa_type', async () => {
    const visaType = 'A';
    const sample = [
      { visa_type: visaType, summary: 'Alpha', updated_at: '2024-01-01' }
    ];
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => sample
    });

    const { status, data } = await fetchVisaUpdates(visaType);
    expect(status).toBe(200);
    data.forEach(item => {
      expect(validate(item)).toBe(true);
      expect(item.visa_type).toBe(visaType);
    });
  });
});
