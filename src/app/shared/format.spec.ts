import { formatDate, formatPercent, formatPeso } from './format';

describe('format', () => {
  it('formats pesos with grouping and the peso sign', () => {
    expect(formatPeso(1234.5)).toBe('₱1,234.50');
    expect(formatPeso(1234.5, 0)).toBe('₱1,235');
    expect(formatPeso(0)).toBe('₱0.00');
  });

  it('shows negatives with a true minus sign and survives bad input', () => {
    expect(formatPeso(-50)).toBe('−₱50.00');
    expect(formatPeso(NaN)).toBe('₱0.00');
  });

  it('trims percentages', () => {
    expect(formatPercent(5)).toBe('5%');
    expect(formatPercent(7.125)).toBe('7.13%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('formats dates with fixed month names', () => {
    expect(formatDate('2026-10-29')).toBe('29 Oct 2026');
    expect(formatDate('2025-01-05')).toBe('5 Jan 2025');
  });
});
