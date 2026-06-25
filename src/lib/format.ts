import { format } from 'date-fns';

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  return format(new Date(value), 'dd MMM yyyy HH:mm');
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  return format(new Date(value), 'dd MMM yyyy');
}

export function formatMoney(value: number | string | null | undefined, currency = 'EUR'): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function localized(json: Record<string, string> | null | undefined, language = 'en'): string {
  if (!json) return '';
  return json[language] ?? json.en ?? Object.values(json)[0] ?? '';
}
