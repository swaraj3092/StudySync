import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Sync with extension if logged in
      if (session?.user?.id) {
        window.dispatchEvent(new CustomEvent('STUDYSYNC_SYNC_USER', { 
          detail: { userId: session.user.id } 
        }));
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user?.id) {
        window.dispatchEvent(new CustomEvent('STUDYSYNC_SYNC_USER', { 
          detail: { userId: session.user.id } 
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
