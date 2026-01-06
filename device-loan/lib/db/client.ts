import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for public/authenticated operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to set user context for RLS
export async function setUserContext(
  client: SupabaseClient,
  auth0Id: string
): Promise<void> {
  await client.rpc('set_config', {
    setting: 'app.current_user_auth0_id',
    value: auth0Id,
    is_local: true,
  });
}

// Database error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    const code = 'code' in error ? String(error.code) : undefined;
    const details = 'details' in error ? error.details : undefined;
    throw new DatabaseError(String(error.message), code, details);
  }
  throw new DatabaseError('Unknown database error');
}
