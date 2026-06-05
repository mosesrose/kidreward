/**
 * MockAuthContext — provides hardcoded auth state for demo/PoC mode.
 * Uses the same AuthContext as the real provider so all useAuth() calls work unchanged.
 * "Sign out" toggles between Parent and Child views instead of actually signing out.
 */
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { AuthContext } from '@/contexts/AuthContext';
import { mockStore, PARENT_PROFILE, CHILD1_PROFILE, MOCK_FAMILY } from '@/lib/mock-data';

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  // Start loading:true so the Root Layout mounts before any navigation fires.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(t);
  }, []);

  const isParent = role === 'parent';
  const profile = isParent ? PARENT_PROFILE : CHILD1_PROFILE;
  const family = MOCK_FAMILY;
  const membership = isParent
    ? null
    : mockStore.family_members.find(m => m.child_id === CHILD1_PROFILE.id) ?? null;

  const [, setTick] = useState(0);
  const refresh = async () => setTick(t => t + 1);

  return (
    <AuthContext.Provider value={{
      session: { user: { id: profile.id } } as any,
      user: { id: profile.id } as any,
      profile,
      family,
      membership,
      loading,
      refreshProfile: refresh,
      refreshFamily: refresh,
      signOut: async () => {
        setRole(r => {
          const next = r === 'parent' ? 'child' : 'parent';
          setTimeout(() => {
            router.replace(next === 'parent' ? '/(parent)/dashboard' : '/(child)/home');
          }, 0);
          return next;
        });
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
}
