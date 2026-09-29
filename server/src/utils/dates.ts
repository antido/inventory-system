/** Formats a Date as 'YYYY-MM-DD' using the local time zone. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the last `n` days (oldest first) as 'YYYY-MM-DD' strings, ending today. */
export function lastNDays(n: number): string[] {
  return datesBetween(daysAgo(n - 1), toDateString(new Date()));
}

/** 'YYYY-MM-DD' for the date `n` days ago. */
export function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return toDateString(date);
}

/** Every date from `from` to `to` (inclusive) as 'YYYY-MM-DD' strings. */
export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (current <= end && dates.length < 366) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
