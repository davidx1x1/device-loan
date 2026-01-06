# Simplified Setup Guide

The project has been migrated to use **Supabase Auth** (instead of Auth0) and **Resend** (instead of SMTP) for a much simpler setup!

## Quick Start (15 minutes)

### 1. Install Dependencies

```bash
cd device-loan
npm install
```

### 2. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run these migrations in order:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_reservation_function.sql`
   - `supabase/migrations/00003_seed_data.sql` (optional - demo data)

4. Go to Authentication > Providers:
   - Enable "Email" provider
   - Set "Site URL" to `http://localhost:3000`

5. Copy your keys from Settings > API:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 3. Set Up Resend (for emails)

1. Create account at [resend.com](https://resend.com)
2. Get your API key from dashboard
3. For dev, use `onboarding@resend.dev` as sender
4. For production, verify your domain

### 4. Configure Environment

Copy the example file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:
```bash
# From Supabase
NEXT_PUBLIC_SUPABASE_URL='https://yourproject.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'

# From Resend
RESEND_API_KEY='re_your_key'
EMAIL_FROM='Device Loans <onboarding@resend.dev>'

# App config
NEXT_PUBLIC_APP_URL='http://localhost:3000'
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's Different?

### ✅ Much Simpler!

**Before (Auth0 + SMTP):**
- Need Auth0 account + configuration
- Need SMTP server + credentials
- Complex callback URL setup
- Need to configure custom actions
- Gmail app passwords, etc.

**After (Supabase + Resend):**
- Everything in Supabase (one account)
- Simple Resend API key
- No complex OAuth flows to configure
- Built-in user management
- Better developer experience

### Authentication

**Users can:**
- Sign up with email/password
- Sign in
- Reset password (via Supabase)
- Automatic profile creation

**No separate Auth0 configuration needed!**

### Email

**Resend advantages:**
- Simple API
- Great free tier (100 emails/day)
- Dashboard to view sent emails
- No SMTP configuration
- Better deliverability than Gmail SMTP

## Testing

### 1. Create a User

Visit http://localhost:3000 and sign up with email/password.

### 2. Check Database

In Supabase dashboard, check that:
- User appears in `auth.users`
- Profile created in `profiles` table (automatic via trigger)

### 3. Test Features

- Browse devices (works without login)
- Reserve a device (requires login)
- Check email in Resend dashboard

### 4. Test Staff Role

In Supabase, go to Table Editor > profiles:
- Find your user
- Change `role` from `student` to `staff`
- Sign in again and visit `/staff`

## Migration from Auth0

If you had Auth0 configured:
1. See `MIGRATION_GUIDE.md` for detailed steps
2. Main changes: API routes, middleware, frontend hooks
3. All instructions are in the migration guide

## Troubleshooting

**Can't sign in?**
- Check Supabase > Authentication > Providers (Email enabled?)
- Check Site URL matches your app URL
- Verify environment variables

**No emails?**
- Check Resend API key
- View sent emails in Resend dashboard
- Free tier: 100 emails/day, 3,000/month

**Profile not created?**
- Check trigger exists: `on_auth_user_created`
- Check function exists: `handle_new_user`
- Run migration 00001 again if needed

## Next Steps

- **Production:** Verify your domain in Resend
- **Security:** Enable email confirmation in Supabase
- **Features:** Add OAuth providers (Google, GitHub) in Supabase Auth

---

**Much simpler than Auth0!** Everything is now in Supabase. 🎉
