import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://mmdwxnzctycuacnkafsl.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZHd4bnpjdHljdWFjbmthZnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTU1NTQsImV4cCI6MjA4NzgzMTU1NH0._qvQywWp-W13KwD9TG9h9054zX66sqEDgHK_k28Dhqw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web we must detect the recovery hash (#access_token=...&type=recovery)
    // so the user lands on /update-password with a valid recovery session.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
