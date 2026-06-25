import { format } from 'date-fns';

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';

  const date = new Date(value);
  if (!isValidDate(date)) return '-';

  return format(date, 'dd MMM yyyy HH:mm');
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';

  const date = new Date(value);
  if (!isValidDate(date)) return '-';

  return format(date, 'dd MMM yyyy');
}

export function formatMoney(value: number | string | null | undefined, currency = 'EUR'): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function localized(json: Record<string, string> | null | undefined, language = 'en'): string {
  if (!json) return '';
  return json[language] ?? json.en ?? Object.values(json)[0] ?? '';
}
