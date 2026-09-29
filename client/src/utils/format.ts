// Helpers to display numbers and dates consistently everywhere.

// Prices are shown in Philippine pesos (₱). Change the currency here to switch it everywhere.
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const currencyWhole = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-US');

export const formatMoney = (value: number) => currency.format(Number(value) || 0);
/** Money without centavos, e.g. "₱1,500" - used on chart axes. */
export const formatMoneyShort = (value: number) => currencyWhole.format(Number(value) || 0);
export const formatNumber = (value: number) => number.format(Number(value) || 0);

/** The API sends dates as 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'. */
function parseDate(value: string) {
  return new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
}

export const formatDate = (value: string) =>
  parseDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatDateTime = (value: string) =>
  parseDate(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Short label for chart axes, e.g. "Sep 29" */
export const formatShortDate = (value: string) =>
  parseDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** 'YYYY-MM-DD' for today minus `days`. */
export function isoDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
