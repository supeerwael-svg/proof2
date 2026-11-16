import { LEVEL_COLORS } from '@/config/levels';
import type { LevelId } from '@/types';

interface LevelBadgeProps {
  levelId?: LevelId | null;
  size?: 'xs' | 'sm';
}

export function LevelBadge({ levelId, size = 'xs' }: LevelBadgeProps) {
  if (!levelId) return null;
  const colors = LEVEL_COLORS[levelId as LevelId];
  if (!colors) return null;

  const sizeClasses = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${colors.bgLight} ${colors.text} ${sizeClasses}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {levelId}
    </span>
  );
}
