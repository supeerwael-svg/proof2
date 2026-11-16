import { Header } from '@/components/Header';
import { FileList } from '@/components/FileList';
import { FoldersService } from '@/services';
import { useI18n } from '@/i18n/I18nContext';
import { useState, useEffect, useCallback } from 'react';
import type { FolderEntity, LevelId } from '@/types';

interface FolderPageProps {
  folderId: string;
  levelId?: LevelId | null;
}

export function FolderPage({ folderId, levelId = null }: FolderPageProps) {
  const { lang } = useI18n();
  const [folder, setFolder] = useState<FolderEntity | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    FoldersService.getById(folderId).then(f => setFolder(f ?? null));
  }, [folderId, refreshKey]);

  if (!folder) return null;

  const title = lang === 'ar' ? folder.name : lang === 'fr' ? folder.nameFr : folder.nameEn;

  return (
    <div className="min-h-screen pb-20">
      <Header title={title} showBack />
      <div className="max-w-md mx-auto px-4 py-4">
        <FileList key={refreshKey} folderId={folderId} sectionKey={folder.sectionKey} onChanged={reload} levelId={levelId} />
      </div>
    </div>
  );
}
