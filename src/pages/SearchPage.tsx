import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Header } from '@/components/Header';
import { FilesService } from '@/services';
import { useI18n } from '@/i18n/I18nContext';
import { FileCard } from '@/components/FileCard';
import { LevelBadge } from '@/components/LevelBadge';
import { DocumentViewer } from '@/viewer/DocumentViewer';
import { LEVEL_IDS } from '@/types';
import { LEVEL_COLORS } from '@/config/levels';
import type { FileEntity, LevelId } from '@/types';

export function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileEntity[]>([]);
  const [previewFile, setPreviewFile] = useState<FileEntity | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelId | 'ALL'>('ALL');
  const [showFilter, setShowFilter] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setResults(await FilesService.search(q.trim()));
  };

  const filteredResults = levelFilter === 'ALL'
    ? results
    : results.filter(f => f.levelId === levelFilter || (f.linkedLevelIds ?? []).includes(levelFilter));

  return (
    <div className="min-h-screen pb-20">
      <Header title={t('sections')} showBack />
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input ps-11"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              levelFilter !== 'ALL'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            <Filter size={14} />
            {levelFilter === 'ALL' ? t('levelFilter') : levelFilter}
          </button>
        </div>

        {showFilter && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setLevelFilter('ALL'); setShowFilter(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                levelFilter === 'ALL'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t('allFiles')}
            </button>
            {LEVEL_IDS.map(lid => {
              const colors = LEVEL_COLORS[lid];
              const active = levelFilter === lid;
              return (
                <button
                  key={lid}
                  onClick={() => { setLevelFilter(lid); setShowFilter(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border-2 ${
                    active ? `${colors.border} ${colors.bgLight} ${colors.text}` : 'border-transparent bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {lid}
                </button>
              );
            })}
          </div>
        )}

        {filteredResults.length > 0 ? (
          <div className="space-y-2">
            {filteredResults.map(f => (
              <FileCard key={f.id} file={f} onOpen={setPreviewFile} onChanged={() => search(query)} />
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('noFilesFound')}</p>
        ) : null}
      </div>
      <DocumentViewer file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
