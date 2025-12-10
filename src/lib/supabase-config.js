// Supabase client wrapper with fallback values
// This ensures the app works even if .env isn't loaded properly

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ysbguilyqjecjvjzzrrz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzYmd1aWx5cWplY2p2anp6cnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODUxNTEsImV4cCI6MjA4MDg2MTE1MX0.uP48myO72jgZbspbjvU99FlWAx8HFzR5fyGfeZhEnVk';

export { SUPABASE_URL, SUPABASE_ANON_KEY };