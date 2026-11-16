import { db } from '@/db/database';
import { SECTIONS, type SectionDef, type FolderDef } from './structure';
import { LEVEL_IDS } from '@/types';
import { LEVEL_DEFAULTS } from '@/config/levels';
import type {
  SectionEntity, FolderEntity, UserEntity, AcademicYearEntity,
  SchoolEntity, SettingsEntity, LevelEntity,
} from '@/types';

const DEFAULT_SCHOOL_ID = 'school-001';
const DEFAULT_YEAR_ID = 'year-default-001';
const DEFAULT_YEAR_KEY = '2026-2027';
const uuid = () => crypto.randomUUID();
const now = () => Date.now();

function baseEntity(overrides: Partial<{ ownerId: string; schoolId: string; academicYearId: string }>) {
  return {
    id: uuid(),
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null,
    syncStatus: 'local' as const,
    ownerId: overrides.ownerId ?? 'system',
    schoolId: overrides.schoolId ?? DEFAULT_SCHOOL_ID,
    academicYearId: overrides.academicYearId ?? DEFAULT_YEAR_ID,
  };
}

async function seedSectionsAndFolders(yearId: string) {
  const existingSections = await db.sections.where('academicYearId').equals(yearId).count();
  if (existingSections > 0) return;

  await db.sections.clear();
  await db.folders.clear();

  const sectionEntities: SectionEntity[] = [];
  const folderEntities: FolderEntity[] = [];

  function walkFolders(sectionKey: string, folders: FolderDef[], parentId: string | null) {
    folders.forEach((f, i) => {
      const folderId = uuid();
      folderEntities.push({
        ...baseEntity({ academicYearId: yearId }),
        key: f.key,
        sectionKey,
        parentFolderId: parentId,
        name: f.name,
        nameEn: f.nameEn,
        nameFr: f.nameFr,
        order: i,
      });
      if (f.folders) walkFolders(sectionKey, f.folders, folderId);
    });
  }

  SECTIONS.forEach((s: SectionDef, i) => {
    const sectionId = uuid();
    sectionEntities.push({
      ...baseEntity({ academicYearId: yearId }),
      key: s.key,
      name: s.name,
      nameEn: s.nameEn,
      nameFr: s.nameFr,
      icon: s.icon,
      order: i,
      useLevels: s.useLevels ?? false,
    });
    walkFolders(s.key, s.folders, null);
  });

  await db.sections.bulkAdd(sectionEntities);
  await db.folders.bulkAdd(folderEntities);
}

async function seedSchool() {
  const existing = await db.schools.count();
  if (existing > 0) return;
  const school: SchoolEntity = {
    ...baseEntity({}),
    name: 'متوسطة',
    nameEn: 'Middle School',
    address: '',
  };
  await db.schools.add(school);
}

async function seedAcademicYear() {
  const existing = await db.academicYears.where('year').equals(DEFAULT_YEAR_KEY).count();
  if (existing > 0) return;
  const year: AcademicYearEntity = {
    ...baseEntity({}),
    id: DEFAULT_YEAR_ID,
    year: DEFAULT_YEAR_KEY,
    isCurrent: true,
    isArchived: false,
    structureCopied: true,
  };
  await db.academicYears.add(year);
}

async function seedDefaultAdmin() {
  const existing = await db.users.where('username').equals('admin').count();
  if (existing > 0) return;

  const salt = crypto.randomUUID();
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode('admin'), 'PBKDF2', false, ['deriveBits']);
  const hashBuf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  const admin: UserEntity = {
    ...baseEntity({ ownerId: 'system' }),
    username: 'admin',
    displayName: 'المسؤول الأول',
    passwordHash: hash,
    passwordSalt: salt,
    role: 'super_admin',
    permissions: [],
    avatarColor: '#0ea5e9',
    lastSeen: now(),
    isOnline: false,
  };
  await db.users.add(admin);
}

async function seedSettings() {
  const existing = await db.settings.count();
  if (existing > 0) return;
  const settings: SettingsEntity = {
    id: 'app-settings',
    theme: 'light',
    language: 'ar',
    lastBackupReminder: now(),
    fontSize: 'medium',
    paletteId: 'blue',
    customColor: null,
    homeCards: [],
  };
  await db.settings.add(settings);
}

async function seedLevels() {
  const existing = await db.levels.count();
  if (existing > 0) return;
  const entities: LevelEntity[] = LEVEL_IDS.map((levelId, i) => {
    const defaults = LEVEL_DEFAULTS[levelId];
    return {
      ...baseEntity({}),
      levelId,
      name: defaults.ar,
      nameEn: defaults.en,
      nameFr: defaults.fr,
      color: ['#10b981', '#0ea5e9', '#f59e0b', '#f43f5e'][i],
      order: i,
    };
  });
  await db.levels.bulkAdd(entities);
}

async function syncStructure(yearId: string) {
  const sectionDefs = await db.sections.where('academicYearId').equals(yearId).toArray();
  for (const s of sectionDefs) {
    if (s.deletedAt !== null) continue;
    const def = SECTIONS.find(d => d.key === s.key);
    if (!def) continue;
    await db.sections.update(s.id, {
      name: def.name,
      nameEn: def.nameEn,
      nameFr: def.nameFr,
      icon: def.icon,
      useLevels: def.useLevels ?? false,
      updatedAt: now(),
    });
  }

  const existing = await db.folders.where('academicYearId').equals(yearId).toArray();
  const idByKey = new Map<string, string>();
  existing.forEach(f => idByKey.set(`${f.sectionKey}:${f.key}`, f.id));

  const toAdd: FolderEntity[] = [];
  function walk(sectionKey: string, folders: FolderDef[], parentKey: string | null) {
    folders.forEach((f, i) => {
      const compositeKey = `${sectionKey}:${f.key}`;
      if (!idByKey.has(compositeKey)) {
        const id = uuid();
        toAdd.push({
          ...baseEntity({ academicYearId: yearId }),
          id,
          key: f.key,
          sectionKey,
          parentFolderId: parentKey ? idByKey.get(`${sectionKey}:${parentKey}`) ?? null : null,
          name: f.name,
          nameEn: f.nameEn,
          nameFr: f.nameFr,
          order: i,
        });
        idByKey.set(compositeKey, id);
      }
      if (f.folders) walk(sectionKey, f.folders, f.key);
    });
  }
  SECTIONS.forEach(s => walk(s.key, s.folders, null));

  if (toAdd.length > 0) await db.folders.bulkAdd(toAdd);
}

export async function seedDatabase() {
  await seedSchool();
  await seedAcademicYear();
  await seedDefaultAdmin();
  await seedSettings();
  await seedLevels();
  await seedSectionsAndFolders(DEFAULT_YEAR_ID);
  const allYears = await db.academicYears.toArray();
  for (const y of allYears) {
    if (y.deletedAt === null) await syncStructure(y.id);
  }
}

export { DEFAULT_SCHOOL_ID, DEFAULT_YEAR_ID, DEFAULT_YEAR_KEY };
export const uuidGen = uuid;
export const nowGen = now;
