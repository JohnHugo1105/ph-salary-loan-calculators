// Number formatting shared by templates and plain-text summaries. Fixed 'en-US' grouping keeps
// server-rendered and browser output identical.

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatPeso(value: number, digits: 0 | 2 = 2): string {
  const n = Number.isFinite(value) ? value : 0;
  const body = (digits === 0 ? whole : money).format(Math.abs(n));
  return `${n < 0 ? '−' : ''}₱${body}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(digits).replace(/\.?0+$/, '')}%`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-29' -> '29 Oct 2026' (fixed names so server and browser output match).
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}
