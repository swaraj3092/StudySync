import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and Anon Key
// You can find these in your Supabase Dashboard under Settings > API
const supabaseUrl = 'https://wljmjentktcgmtsuiuhv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsam1qZW50a3RjZ210c3VpdWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODc5NTcsImV4cCI6MjA5NDA2Mzk1N30.KQvbM6HNtxTtfrD7OytGeJFWoElCMBB4JpJK8PhWfwA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
