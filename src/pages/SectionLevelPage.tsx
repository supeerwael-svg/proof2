import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { FileList } from '@/components/FileList';
import { FoldersService, FilesService, SectionsService } from '@/services';
import { useI18n } from '@/i18n/I18nContext';
import { useRouter } from '@/contexts/RouterContext';
import { LevelBadge } from '@/components/LevelBadge';
import { LEVEL_COLORS } from '@/config/levels';
import { ChevronRight, ChevronLeft, Folder as FolderIcon, AlertCircle } from 'lucide-react';
import type { SectionEntity, FolderEntity, FileEntity, LevelId } from '@/types';

interface SectionLevelPageProps {
  sectionKey: string;
  levelId: string;
}

export function SectionLevelPage({ sectionKey, levelId }: SectionLevelPageProps) {
  const { t, lang, dir } = useI18n();
  const { navigate } = useRouter();
  const [section, setSection] = useState<SectionEntity | null>(null);
  const [rootFolders, setRootFolders] = useState<FolderEntity[]>([]);
  const [unclassified, setUnclassified] = useState<FileEntity[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey(k => k + 1), []);
  const isAll = levelId === 'ALL';

  useEffect(() => {
    SectionsService.getByKey(sectionKey).then(s => setSection(s ?? null));
    FoldersService.getRootBySection(sectionKey).then(setRootFolders);
    if (isAll) {
      FilesService.getUnclassifiedBySection(sectionKey).then(setUnclassified);
    } else {
      setUnclassified([]);
    }
  }, [sectionKey, levelId, refreshKey, isAll]);

  if (!section) return null;

  const title = lang === 'ar' ? section.name : lang === 'fr' ? section.nameFr : section.nameEn;
  const ChevronNext = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const levelIdTyped = levelId as LevelId;

  // For section "exams", the BEM exams folder (ex_bem) should be shown outside levels
  const bemFolder = rootFolders.find(f => f.key === 'ex_bem');
  const levelFolders = rootFolders.filter(f => f.key !== 'ex_bem');

  return (
    <div className="min-h-screen pb-20">
      <Header
        title={`${title} - ${isAll ? t('allLevels') : levelId}`}
        showBack
      />
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {!isAll && (
          <div className={`card p-3 border-2 ${LEVEL_COLORS[levelIdTyped]?.border ?? 'border-slate-300'} flex items-center gap-3`}>
            <div className={`w-12 h-12 rounded-xl ${LEVEL_COLORS[levelIdTyped]?.bgLight} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${LEVEL_COLORS[levelIdTyped]?.text}`}>{levelId}</span>
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${LEVEL_COLORS[levelIdTyped]?.text}`}>
                {levelId}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('levelFilter')}
              </p>
            </div>
          </div>
        )}

        {isAll && unclassified.length > 0 && (
          <button
            onClick={() => navigate({ name: 'section-level', key: sectionKey, levelId: 'UNCLASSIFIED' })}
            className="card p-4 flex items-center gap-3 hover:shadow-md border-2 border-dashed border-amber-400 dark:border-amber-600 transition-all w-full text-start"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">{t('unclassified')}</p>
              <p className="text-xs text-slate-400">{unclassified.length} {t('files')}</p>
            </div>
            <ChevronNext size={16} className="text-slate-400" />
          </button>
        )}

        {levelFolders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('folders')}</h3>
            {levelFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => navigate({ name: 'folder', folderId: folder.id, levelId: isAll ? null : levelIdTyped })}
                className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all w-full text-start"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <FolderIcon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {lang === 'ar' ? folder.name : lang === 'fr' ? folder.nameFr : folder.nameEn}
                </span>
                {!isAll && (
                  <LevelBadge levelId={levelIdTyped} />
                )}
                <ChevronNext size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        )}

        {bemFolder && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">
              {lang === 'ar' ? 'امتحانات شهادة التعليم المتوسط' : lang === 'fr' ? 'Examens BEM' : 'BEM Exams'}
            </h3>
            <button
              onClick={() => navigate({ name: 'folder', folderId: bemFolder.id })}
              className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all w-full text-start"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                <FolderIcon size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? bemFolder.name : lang === 'fr' ? bemFolder.nameFr : bemFolder.nameEn}
              </span>
              <ChevronNext size={16} className="text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
