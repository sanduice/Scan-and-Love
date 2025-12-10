import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/hooks/useSupabaseData';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Migrate session data when user logs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            migrateSessionToUser(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Migrate session data to user account after login
  const migrateSessionToUser = async (userId) => {
    const sessionId = getSessionId();
    
    try {
      // Migrate cart items
      await supabase
        .from('cart_items')
        .update({ user_id: userId, session_id: null })
        .eq('session_id', sessionId);

      // Migrate saved designs
      await supabase
        .from('saved_designs')
        .update({ user_id: userId, session_id: null })
        .eq('session_id', sessionId);

      // Migrate name badge designs
      await supabase
        .from('name_badge_designs')
        .update({ user_id: userId, session_id: null })
        .eq('session_id', sessionId);

      // Migrate name badge orders
      await supabase
        .from('name_badge_orders')
        .update({ user_id: userId, session_id: null })
        .eq('session_id', sessionId);

      // Migrate sticker orders
      await supabase
        .from('sticker_orders')
        .update({ user_id: userId, session_id: null })
        .eq('session_id', sessionId);

      console.log('Session data migrated to user account');
    } catch (err) {
      console.error('Error migrating session data:', err);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
