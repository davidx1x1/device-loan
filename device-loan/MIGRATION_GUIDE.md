# Migration Guide: Auth0 + SMTP → Supabase Auth + Resend

This document outlines the changes made to replace Auth0 with Supabase Auth and SMTP/Nodemailer with Resend.

## ✅ Completed Changes

### 1. Dependencies
- ❌ Removed: `@auth0/nextjs-auth0`, `nodemailer`, `@types/nodemailer`
- ✅ Added: `@supabase/ssr`, `resend`

### 2. Database Schema
File: `supabase/migrations/00001_initial_schema.sql`

**Changes:**
- Renamed `users` table to `profiles`
- Changed to reference `auth.users(id)` from Supabase Auth
- Removed `auth0_id` column
- Added automatic profile creation trigger on user signup
- Updated RLS policies to use `auth.uid()` instead of custom settings

### 3. New Files Created

#### Auth Utilities
- `lib/auth/supabase-server.ts` - Server-side Supabase client
- `lib/auth/supabase-client.ts` - Client-side Supabase client
- `lib/types/supabase.ts` - Database type definitions

#### Email Service
- `lib/email/resend-service.ts` - Resend email service (replaces `lib/email/service.ts`)

## 🔧 Required Code Changes

### Step 1: Update Middleware (RBAC)

**File:** `lib/middleware/rbac.ts`

Replace entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { UserRole } from '../types/database';
import { createContextLogger } from '../logging/logger';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  correlation_id: string;
}

// Middleware to check authentication
export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthenticatedRequest['user']; correlation_id: string } | NextResponse> {
  const logger = createContextLogger({
    correlation_id: req.headers.get('x-correlation-id') || undefined,
  });

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      logger.warn('Unauthenticated access attempt');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error({ error: profileError }, 'Failed to fetch user profile');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_ERROR',
            message: 'Failed to fetch user profile',
          },
        },
        { status: 500 }
      );
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
      correlation_id: logger.bindings().correlation_id as string,
    };
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error',
        },
      },
      { status: 500 }
    );
  }
}

// Middleware to check for specific role
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedRequest['user']; correlation_id: string } | NextResponse> {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  if (!user || !allowedRoles.includes(user.role)) {
    const logger = createContextLogger({ correlation_id: authResult.correlation_id });
    logger.warn(
      { user_id: user?.id, role: user?.role, allowed_roles: allowedRoles },
      'Unauthorized role access attempt'
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      },
      { status: 403 }
    );
  }

  return authResult;
}

// Middleware to check if user is staff
export async function requireStaff(
  req: NextRequest
): Promise<{ user: AuthenticatedRequest['user']; correlation_id: string } | NextResponse> {
  return requireRole(req, ['staff']);
}
```

### Step 2: Update Database Client

**File:** `lib/db/client.ts`

Replace with:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for public/authenticated operations
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for service operations (bypasses RLS)
export const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey);

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
```

### Step 3: Create Auth API Routes

**File:** `app/api/auth/signup/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
```

**File:** `app/api/auth/signin/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ user: data.user });
}
```

**File:** `app/api/auth/signout/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
```

**File:** `app/api/auth/user/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null });
  }

  // Get profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ user: { ...user, profile } });
}
```

### Step 4: Update Email Service Imports

**In ALL API route files that use email:**
- Replace: `import { sendX } from '@/lib/email/service';`
- With: `import { sendX } from '@/lib/email/resend-service';`

Files to update:
- `app/api/reservations/route.ts`
- `app/api/staff/collect/route.ts`
- `app/api/staff/return/route.ts`

### Step 5: Update Frontend Components

**File:** `app/devices/page.tsx`

Add Supabase Auth hook:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import DeviceCard from '../components/DeviceCard';

export default function DevicesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Replace Auth0 URLs with Supabase Auth
  // Instead of /api/auth/login, use your custom /api/auth/signin or redirect to sign-in page
  // ...rest of code
}
```

### Step 6: Update Environment Variables

**File:** `.env.local.example`

Replace:
```bash
# Remove Auth0 vars:
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Remove SMTP vars:
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

With:
```bash
# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM='Device Loans <onboarding@resend.dev>'

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
DEFAULT_LOAN_DURATION_DAYS=2
LOG_LEVEL=info
```

## 📝 Manual Tasks

### 1. Delete Old Files
```bash
rm lib/auth/config.ts
rm app/api/auth/[auth0]/route.ts
rm lib/email/service.ts
```

### 2. Update Package.json
Already done - Auth0 and Nodemailer removed, Supabase SSR and Resend added.

### 3. Enable Supabase Auth
In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Email auth
3. Configure email templates (optional)
4. Set site URL to your app URL

### 4. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`

### 5. Update All References
Search and replace in all files:
- `@auth0/nextjs-auth0` → `@/lib/auth/supabase-server` or `@/lib/auth/supabase-client`
- `/api/auth/login` → `/api/auth/signin` (or your custom auth flow)
- `/api/auth/logout` → `/api/auth/signout`
- `lib/email/service` → `lib/email/resend-service`

## 🎯 Benefits of This Migration

1. **Simpler Setup**: No need for separate Auth0 account
2. **Better Integration**: Auth built into Supabase
3. **Easier Email**: Resend has better developer experience than SMTP
4. **Cost**: Free tiers for both Supabase Auth and Resend
5. **Type Safety**: Better TypeScript integration

## ⚠️ Important Notes

- Supabase Auth stores users in `auth.users` schema
- Your app's `profiles` table is automatically synced via trigger
- RLS policies use `auth.uid()` to get current user
- Resend requires verified domain for production (dev uses onboarding@resend.dev)

## 🧪 Testing

After migration:
1. Sign up a new user
2. Check that profile is created in `profiles` table
3. Sign in and access protected routes
4. Verify emails are sent via Resend dashboard
5. Test role-based access (student vs staff)

## 📚 Documentation Updates

Update these files:
- `README.md` - Remove Auth0 section, add Supabase Auth section
- `DEPLOYMENT.md` - Update setup instructions
- `QUICK_START.md` - Simpler setup without Auth0
- Remove all Auth0 references

---

**Migration Status**: Schema and dependencies complete. API routes and frontend components need updating per instructions above.
