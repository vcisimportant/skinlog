import { describe, expect, test } from 'vitest';
import { analysisPrompt } from './prompt';

describe('analysisPrompt', () => {
  test('tells the reader how many days it is working from', () => {
    expect(analysisPrompt(64)).toContain('64 days');
  });

  test('asks for lagged correlations, not just same-day ones', () => {
    const p = analysisPrompt(30);
    expect(p).toMatch(/lag/i);
    expect(p).toContain('14');
  });

  test('explains that 1 is good and 5 is bad, which the numbers alone do not say', () => {
    expect(analysisPrompt(30)).toMatch(/1 \(best\).*5 \(worst\)/s);
  });
});
