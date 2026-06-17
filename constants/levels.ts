export type Level = {
  level: number;
  title: string;
  emoji: string;
  minGems: number;
  maxGems: number;
};

export const LEVELS: Level[] = [
  { level: 1, title: 'Starter',    emoji: '🌱', minGems: 0,    maxGems: 99   },
  { level: 2, title: 'Explorer',   emoji: '🔍', minGems: 100,  maxGems: 249  },
  { level: 3, title: 'Adventurer', emoji: '⚔️', minGems: 250,  maxGems: 499  },
  { level: 4, title: 'Champion',   emoji: '🏆', minGems: 500,  maxGems: 999  },
  { level: 5, title: 'Super Hero', emoji: '⚡', minGems: 1000, maxGems: 1999 },
  { level: 6, title: 'Legend',     emoji: '🌟', minGems: 2000, maxGems: Infinity },
];

export function getLevel(totalGemsEarned: number): Level {
  return [...LEVELS].reverse().find(l => totalGemsEarned >= l.minGems) ?? LEVELS[0];
}

export function getLevelProgress(totalGemsEarned: number): number {
  const l = getLevel(totalGemsEarned);
  if (l.maxGems === Infinity) return 1;
  return (totalGemsEarned - l.minGems) / (l.maxGems - l.minGems);
}

export function gemsToNextLevel(totalGemsEarned: number): number {
  const l = getLevel(totalGemsEarned);
  if (l.maxGems === Infinity) return 0;
  return l.maxGems - totalGemsEarned + 1;
}
