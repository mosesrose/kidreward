import type { Profile, Family, FamilyMember, Challenge, Completion, Reward, Redemption, Invite } from './supabase';

// ─── Profiles ────────────────────────────────────────────────────────────────

export const PARENT_PROFILE: Profile = {
  id: 'mock-parent-id',
  name: 'Sarah',
  role: 'parent',
  avatar_emoji: '👩',
  created_at: '2024-01-01T00:00:00Z',
};

export const CHILD1_PROFILE: Profile = {
  id: 'mock-child1-id',
  name: 'Emma',
  role: 'child',
  avatar_emoji: '🧒',
  created_at: '2024-01-01T00:00:00Z',
};

export const CHILD2_PROFILE: Profile = {
  id: 'mock-child2-id',
  name: 'Jack',
  role: 'child',
  avatar_emoji: '🦊',
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_FAMILY: Family = {
  id: 'mock-family-id',
  name: 'The Johnson Family',
  parent_id: 'mock-parent-id',
  created_at: '2024-01-01T00:00:00Z',
};

// ─── Mutable in-memory store — mutations during a session persist here ────────

export const mockStore: {
  profiles: Profile[];
  families: Family[];
  family_members: (FamilyMember & { profiles: Profile; families?: Family })[];
  challenges: Challenge[];
  completions: (Completion & { challenges?: Challenge; profiles?: Profile })[];
  rewards: Reward[];
  redemptions: (Redemption & { rewards?: Reward; profiles?: Profile })[];
  invites: Invite[];
} = {
  profiles: [PARENT_PROFILE, CHILD1_PROFILE, CHILD2_PROFILE],

  families: [MOCK_FAMILY],

  family_members: [
    {
      id: 'mock-member1-id',
      family_id: 'mock-family-id',
      child_id: 'mock-child1-id',
      gem_balance: 85,
      total_gems_earned: 245,
      joined_at: '2024-01-02T00:00:00Z',
      profiles: CHILD1_PROFILE,
      families: MOCK_FAMILY,
    },
    {
      id: 'mock-member2-id',
      family_id: 'mock-family-id',
      child_id: 'mock-child2-id',
      gem_balance: 42,
      total_gems_earned: 180,
      joined_at: '2024-01-03T00:00:00Z',
      profiles: CHILD2_PROFILE,
      families: MOCK_FAMILY,
    },
  ],

  challenges: [
    {
      id: 'ch-1', family_id: 'mock-family-id', child_id: null,
      title: 'Keep room tidy', description: 'Make your bed and keep your room clean all day',
      category: 'room', emoji: '🛏️', gem_reward: 10, bonus_gems: 5,
      status: 'active', repeat_type: 'daily', due_date: null,
      created_by: 'mock-parent-id', created_at: '2024-01-05T00:00:00Z',
    },
    {
      id: 'ch-2', family_id: 'mock-family-id', child_id: null,
      title: 'Do homework early', description: 'Finish all homework before 5 PM',
      category: 'homework', emoji: '📚', gem_reward: 15, bonus_gems: 5,
      status: 'active', repeat_type: 'daily', due_date: null,
      created_by: 'mock-parent-id', created_at: '2024-01-04T00:00:00Z',
    },
    {
      id: 'ch-3', family_id: 'mock-family-id', child_id: null,
      title: 'Help clean the house', description: 'Help with cleaning — vacuum, mop, wipe surfaces, etc.',
      category: 'chores', emoji: '🧹', gem_reward: 20, bonus_gems: 5,
      status: 'active', repeat_type: 'weekly', due_date: null,
      created_by: 'mock-parent-id', created_at: '2024-01-03T00:00:00Z',
    },
    {
      id: 'ch-4', family_id: 'mock-family-id', child_id: 'mock-child1-id',
      title: 'Math homework streak', description: 'Do math homework every day for a week without being reminded',
      category: 'math', emoji: '🔢', gem_reward: 50, bonus_gems: 20,
      status: 'active', repeat_type: 'weekly', due_date: null,
      created_by: 'mock-parent-id', created_at: '2024-01-02T00:00:00Z',
    },
    {
      id: 'ch-5', family_id: 'mock-family-id', child_id: null,
      title: 'No yelling all day', description: 'Stay calm and speak kindly to everyone all day',
      category: 'behavior', emoji: '😌', gem_reward: 20, bonus_gems: 10,
      status: 'active', repeat_type: 'daily', due_date: null,
      created_by: 'mock-parent-id', created_at: '2024-01-01T00:00:00Z',
    },
  ],

  completions: [
    {
      id: 'comp-1', challenge_id: 'ch-1', child_id: 'mock-child1-id',
      note: 'I made my bed and tidied my desk! 🛏️', status: 'pending',
      gems_awarded: null, submitted_at: new Date(Date.now() - 3_600_000).toISOString(),
      reviewed_at: null, reviewed_by: null,
    },
    {
      id: 'comp-2', challenge_id: 'ch-2', child_id: 'mock-child2-id',
      note: 'Done all maths and English!', status: 'pending',
      gems_awarded: null, submitted_at: new Date(Date.now() - 7_200_000).toISOString(),
      reviewed_at: null, reviewed_by: null,
    },
    {
      id: 'comp-3', challenge_id: 'ch-3', child_id: 'mock-child1-id',
      note: null, status: 'approved', gems_awarded: 20,
      submitted_at: new Date(Date.now() - 86_400_000).toISOString(),
      reviewed_at: new Date(Date.now() - 82_800_000).toISOString(),
      reviewed_by: 'mock-parent-id',
    },
    {
      id: 'comp-4', challenge_id: 'ch-5', child_id: 'mock-child1-id',
      note: 'I was really calm today', status: 'rejected',
      gems_awarded: null, submitted_at: new Date(Date.now() - 172_800_000).toISOString(),
      reviewed_at: new Date(Date.now() - 169_200_000).toISOString(),
      reviewed_by: 'mock-parent-id',
    },
  ],

  rewards: [
    {
      id: 'rw-1', family_id: 'mock-family-id', title: '£1 pocket money',
      description: 'Cash in hand!', emoji: '💵', gem_cost: 50,
      reward_type: 'money', is_active: true,
      created_by: 'mock-parent-id', created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rw-2', family_id: 'mock-family-id', title: '30 min extra screen time',
      description: 'An extra 30 minutes on your tablet or TV', emoji: '📱', gem_cost: 30,
      reward_type: 'screen_time', is_active: true,
      created_by: 'mock-parent-id', created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rw-3', family_id: 'mock-family-id', title: 'Movie night pick',
      description: 'You choose the family movie!', emoji: '🎬', gem_cost: 60,
      reward_type: 'activity', is_active: true,
      created_by: 'mock-parent-id', created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rw-4', family_id: 'mock-family-id', title: 'Small gift (£5)',
      description: 'Pick a small toy or treat from the shop', emoji: '🎁', gem_cost: 100,
      reward_type: 'gift', is_active: true,
      created_by: 'mock-parent-id', created_at: '2024-01-01T00:00:00Z',
    },
  ],

  redemptions: [
    {
      id: 'red-1', reward_id: 'rw-2', child_id: 'mock-child2-id',
      family_id: 'mock-family-id', gems_spent: 30, status: 'pending',
      note: null, requested_at: new Date(Date.now() - 3_600_000).toISOString(),
      fulfilled_at: null,
    },
    {
      id: 'red-2', reward_id: 'rw-1', child_id: 'mock-child1-id',
      family_id: 'mock-family-id', gems_spent: 50, status: 'fulfilled',
      note: null, requested_at: new Date(Date.now() - 86_400_000).toISOString(),
      fulfilled_at: new Date(Date.now() - 82_800_000).toISOString(),
    },
  ],

  invites: [
    {
      id: 'invite-1', family_id: 'mock-family-id', code: 'ABC123',
      email: null, invite_type: 'child' as const,
      created_by: 'mock-parent-id', used_by: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      used_at: null, created_at: new Date(Date.now() - 3_600_000).toISOString(),
    },
  ],
};

// ─── Helpers to enrich results with related data ──────────────────────────────

export function enrichCompletions(completions: typeof mockStore.completions) {
  return completions.map(c => ({
    ...c,
    challenges: mockStore.challenges.find(ch => ch.id === c.challenge_id),
    profiles: mockStore.profiles.find(p => p.id === c.child_id),
  }));
}

export function enrichRedemptions(redemptions: typeof mockStore.redemptions) {
  return redemptions.map(r => ({
    ...r,
    rewards: mockStore.rewards.find(rw => rw.id === r.reward_id),
    profiles: mockStore.profiles.find(p => p.id === r.child_id),
  }));
}
