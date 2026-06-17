import type { IconName } from './icons';

export type ChallengeTemplate = {
  title: string;
  description: string;
  category: string;
  icon: IconName;
  defaultGems: number;
  defaultBonus: number;
  repeatType: 'once' | 'daily' | 'weekly';
};

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    title: 'Less screen time today',
    description: 'Keep your phone usage under 2 hours today',
    category: 'phone',
    icon: 'cellphone-off',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Play outside',
    description: 'Spend at least 30 minutes playing or exercising outside',
    category: 'outdoor',
    icon: 'tree',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Hang out with friends',
    description: 'Spend quality time with a friend (in person)',
    category: 'social',
    icon: 'account-multiple',
    defaultGems: 10,
    defaultBonus: 0,
    repeatType: 'weekly',
  },
  {
    title: 'Family time',
    description: 'Join the family for an activity or meal without screens',
    category: 'family',
    icon: 'account-group',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Up early on a school day',
    description: 'Wake up and be ready before the agreed time',
    category: 'morning',
    icon: 'weather-sunny',
    defaultGems: 15,
    defaultBonus: 10,
    repeatType: 'daily',
  },
  {
    title: 'Help a brother or sister',
    description: 'Do something kind or helpful for a sibling today',
    category: 'sibling',
    icon: 'hand-heart',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Help clean the house',
    description: 'Help with cleaning — vacuum, mop, wipe surfaces, etc.',
    category: 'chores',
    icon: 'broom',
    defaultGems: 20,
    defaultBonus: 5,
    repeatType: 'weekly',
  },
  {
    title: 'Keep room tidy',
    description: 'Make your bed and keep your room clean all day',
    category: 'room',
    icon: 'bed',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Help in the garden',
    description: 'Water plants, pull weeds, or help with any garden task',
    category: 'garden',
    icon: 'flower',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'weekly',
  },
  {
    title: 'Help prepare dinner',
    description: 'Help chop, stir, set the table, or assist with cooking',
    category: 'cooking',
    icon: 'silverware-fork-knife',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Math homework streak',
    description: 'Do math homework every day for a week without being reminded',
    category: 'math',
    icon: 'calculator',
    defaultGems: 50,
    defaultBonus: 20,
    repeatType: 'weekly',
  },
  {
    title: 'Do homework early',
    description: 'Finish all homework before 5 PM',
    category: 'homework',
    icon: 'book-open-variant',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'No missing homework',
    description: 'Complete and hand in every assignment this week',
    category: 'homework',
    icon: 'book-open-variant',
    defaultGems: 30,
    defaultBonus: 15,
    repeatType: 'weekly',
  },
  {
    title: 'No yelling all day',
    description: 'Stay calm and speak kindly to everyone all day',
    category: 'behavior',
    icon: 'emoticon-happy-outline',
    defaultGems: 20,
    defaultBonus: 10,
    repeatType: 'daily',
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  phone:    '#FF6B6B',
  outdoor:  '#51CF66',
  social:   '#FF9FF3',
  family:   '#FFA94D',
  morning:  '#FFD43B',
  sibling:  '#74C0FC',
  chores:   '#63E6BE',
  room:     '#A9E34B',
  garden:   '#69DB7C',
  cooking:  '#FF8787',
  math:     '#748FFC',
  homework: '#DA77F2',
  behavior: '#F783AC',
};

export const AVATAR_OPTIONS = ['🧒', '👦', '👧', '🧑', '🦸', '🧙', '🦊', '🐼', '🦁', '🐸', '🚀', '⭐'];

export type ChallengeValue =
  | 'responsibility' | 'kindness' | 'patience'
  | 'curiosity' | 'courage' | 'empathy';

export const CHALLENGE_VALUES: {
  key: ChallengeValue;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: 'responsibility', label: 'Responsibility', emoji: '🏆', color: '#4B634D' },
  { key: 'kindness',       label: 'Kindness',       emoji: '💛', color: '#D97706' },
  { key: 'patience',       label: 'Patience',       emoji: '⏳', color: '#6366F1' },
  { key: 'curiosity',      label: 'Curiosity',      emoji: '🔍', color: '#0EA5E9' },
  { key: 'courage',        label: 'Courage',        emoji: '🦁', color: '#DC2626' },
  { key: 'empathy',        label: 'Empathy',        emoji: '💜', color: '#7C3AED' },
];

export const VALUE_COLORS: Record<ChallengeValue, string> = Object.fromEntries(
  CHALLENGE_VALUES.map(v => [v.key, v.color])
) as Record<ChallengeValue, string>;
