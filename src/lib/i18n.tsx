import React, { createContext, useContext, useMemo, useState } from 'react';
import en from '../messages/en.json';
import es from '../messages/es.json';
import it from '../messages/it.json';
import type { Language } from '../types/domain';

const dictionaries: Record<Language, Record<string, string>> = { en, es, it };

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const initial = (localStorage.getItem('trainer.language') as Language | null) ?? 'en';
  const [language, setLanguageState] = useState<Language>(['en', 'es', 'it'].includes(initial) ? initial : 'en');

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage(next) {
      localStorage.setItem('trainer.language', next);
      setLanguageState(next);
    },
    t(key, fallback) {
      return dictionaries[language][key] ?? dictionaries.en[key] ?? fallback ?? key;
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
