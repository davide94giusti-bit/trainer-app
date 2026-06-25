import { format } from 'date-fns';

function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value?: string | null): string {
  const date = safeDate(value);
  if (!date) return '-';
  return format(date, 'dd MMM yyyy HH:mm');
}

export function formatDate(value?: string | null): string {
  const date = safeDate(value);
  if (!date) return '-';
  return format(date, 'dd MMM yyyy');
}

export function formatMoney(value: number | string | null | undefined, currency = 'EUR', locale?: string): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number.isFinite(amount) ? amount : 0);
}

export function localized(json: Record<string, string> | null | undefined, language = 'en'): string {
  if (!json) return '';
  return json[language] ?? json.en ?? Object.values(json)[0] ?? '';
}
