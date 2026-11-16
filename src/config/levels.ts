import type { LevelId } from '@/types';

export const LEVEL_COLORS: Record<LevelId, { bg: string; text: string; border: string; bgLight: string; dot: string }> = {
  '1AM': {
    bg: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-400 dark:border-emerald-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    dot: '#10b981',
  },
  '2AM': {
    bg: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-400 dark:border-sky-600',
    bgLight: 'bg-sky-50 dark:bg-sky-900/20',
    dot: '#0ea5e9',
  },
  '3AM': {
    bg: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-400 dark:border-amber-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    dot: '#f59e0b',
  },
  '4AM': {
    bg: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-400 dark:border-rose-600',
    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
    dot: '#f43f5e',
  },
};

export const LEVEL_DEFAULTS: Record<LevelId, { ar: string; en: string; fr: string }> = {
  '1AM': { ar: 'الأولى متوسط', en: '1st Year Middle', fr: '1ère Année Moyenne' },
  '2AM': { ar: 'الثانية متوسط', en: '2nd Year Middle', fr: '2ème Année Moyenne' },
  '3AM': { ar: 'الثالثة متوسط', en: '3rd Year Middle', fr: '3ème Année Moyenne' },
  '4AM': { ar: 'الرابعة متوسط', en: '4th Year Middle', fr: '4ème Année Moyenne' },
};

export const LEVEL_SECTIONS = ['exams', 'books', 'aids', 'av'] as const;
export type LevelSectionKey = typeof LEVEL_SECTIONS[number];
