import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile, Family, FamilyMember } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  family: Family | null;
  membership: FamilyMember | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshFamily: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  family: null,
  membership: null,
  loading: true,
  refreshProfile: async () => {},
  refreshFamily: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [membership, setMembership] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setFamily(null);
        setMembership(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId: string) {
    setLoading(true);
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(prof);

      if (prof?.role === 'parent') {
        const { data: fam } = await supabase
          .from('families')
          .select('*')
          .eq('parent_id', userId)
          .single();
        setFamily(fam);
      } else if (prof?.role === 'child') {
        const { data: mem } = await supabase
          .from('family_members')
          .select('*, families(*)')
          .eq('child_id', userId)
          .single();
        setMembership(mem);
        if (mem) setFamily((mem as any).families);
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (session?.user.id) await loadUserData(session.user.id);
  }

  async function refreshFamily() {
    if (!session?.user.id || !profile) return;
    if (profile.role === 'parent') {
      const { data } = await supabase
        .from('families')
        .select('*')
        .eq('parent_id', session.user.id)
        .single();
      setFamily(data);
    } else {
      const { data } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('child_id', session.user.id)
        .single();
      setMembership(data);
      if (data) setFamily((data as any).families);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      family,
      membership,
      loading,
      refreshProfile,
      refreshFamily,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
