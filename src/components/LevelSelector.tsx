import { useState, useEffect } from 'react';
import { Layers, FileQuestion } from 'lucide-react';
import { LevelsService, FilesService } from '@/services';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from '@/contexts/RouterContext';
import { LEVEL_COLORS } from '@/config/levels';
import { formatDate } from '@/utils/format';
import type { LevelEntity, LevelId } from '@/types';

interface LevelSelectorProps {
  sectionKey: string;
}

export function LevelSelector({ sectionKey }: LevelSelectorProps) {
  const { lang, t } = useI18n();
  const { navigate } = useRouter();
  const [levels, setLevels] = useState<LevelEntity[]>([]);
  const [stats, setStats] = useState<Record<string, { count: number; lastUpdate: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LevelsService.getAll().then(async (lvls) => {
      setLevels(lvls);
      const s: Record<string, { count: number; lastUpdate: number }> = {};
      for (const l of lvls) {
        s[l.levelId] = await FilesService.getLevelStats(sectionKey, l.levelId);
      }
      setStats(s);
      setLoading(false);
    });
  }, [sectionKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 px-1">
        <Layers size={18} />
        <span>{t('selectLevel')}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {levels.map((level) => {
          const colors = LEVEL_COLORS[level.levelId as LevelId];
          const st = stats[level.levelId] ?? { count: 0, lastUpdate: 0 };
          const name = lang === 'ar' ? level.name : lang === 'fr' ? level.nameFr : level.nameEn;
          return (
            <button
              key={level.id}
              onClick={() => navigate({ name: 'section-level', key: sectionKey, levelId: level.levelId })}
              className={`card p-4 text-start border-2 ${colors.border} hover:shadow-lg hover:scale-[1.02] transition-all relative overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bg}`} />
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bgLight} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${colors.text}`}>{level.levelId}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${colors.text} truncate`}>{name}</p>
                  <p className="text-xs text-slate-400">{level.levelId}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{st.count}</span> {t('files')}
                </p>
                <p className="text-xs text-slate-400">
                  {st.lastUpdate > 0 ? formatDate(st.lastUpdate, lang) : t('noUpdate')}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => navigate({ name: 'section-level', key: sectionKey, levelId: 'ALL' })}
        className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all w-full text-start border-2 border-dashed border-slate-300 dark:border-slate-600"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <FileQuestion size={20} className="text-slate-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{t('allLevels')}</p>
          <p className="text-xs text-slate-400">{t('allLevelsHint')}</p>
        </div>
      </button>
    </div>
  );
}
