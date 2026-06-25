import fs from 'node:fs';
import path from 'node:path';

const messagesDir = path.resolve('src/messages');
const requiredLocales = ['en', 'es', 'it'] as const;

type Locale = (typeof requiredLocales)[number];
type Dictionary = Record<string, unknown>;

function readDictionary(locale: Locale): Dictionary {
  const file = path.join(messagesDir, `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Dictionary;
}

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
      const next = prefix ? `${prefix}.${key}` : key;
      return flattenKeys(nested, next);
    });
  }
  return [prefix];
}

const dictionaries = Object.fromEntries(requiredLocales.map(locale => [locale, readDictionary(locale)])) as Record<Locale, Dictionary>;
const englishKeys = new Set(flattenKeys(dictionaries.en).filter(Boolean));
let hasError = false;

for (const locale of requiredLocales.filter(locale => locale !== 'en')) {
  const localeKeys = new Set(flattenKeys(dictionaries[locale]).filter(Boolean));
  const missing = [...englishKeys].filter(key => !localeKeys.has(key)).sort();
  const extra = [...localeKeys].filter(key => !englishKeys.has(key)).sort();

  if (missing.length || extra.length) {
    hasError = true;
    console.error(`\n${locale}.json translation key mismatch:`);
    if (missing.length) console.error(`Missing keys: ${missing.join(', ')}`);
    if (extra.length) console.error(`Extra keys: ${extra.join(', ')}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`i18n key coverage OK: ${englishKeys.size} keys across ${requiredLocales.join(', ')}`);
