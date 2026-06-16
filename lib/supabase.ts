import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { mockSupabase } from './mock-supabase';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SSR-safe localStorage check (undefined during expo export / Node.js SSR)
const hasLocalStorage = Platform.OS === 'web' && typeof localStorage !== 'undefined';

const storage = hasLocalStorage
  ? {
      // Browser: use localStorage
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    }
  : Platform.OS === 'web'
    ? {
        // SSR / build time: no-op storage (session not needed during build)
        getItem: (_key: string) => Promise.resolve(null),
        setItem: (_key: string, _value: string) => Promise.resolve(),
        removeItem: (_key: string) => Promise.resolve(),
      }
    : require('@react-native-async-storage/async-storage').default;

// In mock mode the real client is never created (env vars may be absent).
const _realSupabase = USE_MOCK ? null! : createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const supabase = (USE_MOCK ? mockSupabase : _realSupabase) as typeof _realSupabase;

export type Profile = {
  id: string;
  name: string;
  role: 'parent' | 'child';
  avatar_emoji: string;
  created_at: string;
};

export type Family = {
  id: string;
  name: string;
  parent_id: string;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  family_id: string;
  child_id: string;
  gem_balance: number;
  total_gems_earned: number;
  joined_at: string;
  profiles?: Profile;
};

export type Invite = {
  id: string;
  family_id: string;
  code: string;
  email: string | null;
  invite_type: 'child' | 'parent';
  created_by: string;
  used_by: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  status: 'pending' | 'used' | 'cancelled';
};

export type Challenge = {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  category: string;
  emoji: string;
  gem_reward: number;
  bonus_gems: number;
  status: 'active' | 'completed' | 'archived';
  repeat_type: 'once' | 'daily' | 'weekly';
  due_date: string | null;
  created_by: string;
  created_at: string;
};

export type Completion = {
  id: string;
  challenge_id: string;
  child_id: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  gems_awarded: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  challenges?: Challenge;
  profiles?: Profile;
};

export type Reward = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  emoji: string;
  gem_cost: number;
  reward_type: 'money' | 'gift' | 'screen_time' | 'activity';
  is_active: boolean;
  created_by: string;
  created_at: string;
};

export type Redemption = {
  id: string;
  reward_id: string;
  child_id: string;
  family_id: string;
  gems_spent: number;
  status: 'pending' | 'fulfilled' | 'rejected';
  note: string | null;
  requested_at: string;
  fulfilled_at: string | null;
  rewards?: Reward;
};
