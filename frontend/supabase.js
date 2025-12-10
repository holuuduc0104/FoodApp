import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://ubktyiuetwoodibjhvxy.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3R5aXVldHdvb2RpYmpodnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDAxNzAsImV4cCI6MjA4MDQxNjE3MH0.SYDVgoDM3yrf49lk7nPuVvvHnfoUcHpqo5HY9B8kOBk"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})
