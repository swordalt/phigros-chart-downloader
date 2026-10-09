export const DIFFICULTY_ORDER = ['EZ', 'HD', 'IN', 'AT'] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
    EZ: '#4ade80',
    HD: '#38bdf8',
    IN: '#f87171',
    AT: '#e2e8f0',
};

// Used for charts outside the four standard difficulties (e.g. extra charts such as SP).
const EXTRA_DIFFICULTY_COLOR = '#c084fc';

export const getDifficultyColor = (difficulty: string): string =>
    DIFFICULTY_COLORS[difficulty] ?? EXTRA_DIFFICULTY_COLOR;

// Whole-number level for compact displays ("15.3" → "15"); non-numeric levels such as "?" pass through.
export const floorLevel = (level: string): string => {
    const n = parseFloat(level);
    return Number.isFinite(n) ? String(Math.floor(n)) : level;
};
