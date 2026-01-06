# Quick Start Guide

## ✅ Migration Complete!

The application has been successfully migrated from Auth0 to Supabase Auth, and from SMTP to Resend for emails.

## 🚀 Getting Started

### 1. Database Setup (Already Done ✓)

You've already run the initial migration! Now add some sample data:

1. Go to your Supabase Dashboard → **SQL Editor**
2. Run the seed script from `supabase/seed.sql`
3. This will add 8 device models and 24 individual devices

### 2. Configure Environment Variables

Your `.env.local` should have (you've already started this):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'

# Resend Email Configuration
RESEND_API_KEY='re_xxxxxxxxxxxx'
EMAIL_FROM='Device Loans <onboarding@resend.dev>'

# Application Configuration
NEXT_PUBLIC_APP_URL='http://localhost:3000'
NODE_ENV='development'
DEFAULT_LOAN_DURATION_DAYS='2'
LOG_LEVEL='info'
```

### 3. Get Resend API Key

1. Go to https://resend.com/
2. Sign up for a free account (100 emails/day free)
3. Go to **API Keys** in the dashboard
4. Create a new API key
5. Add it to your `.env.local` as `RESEND_API_KEY`

### 4. Enable Supabase Email Auth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Under **Authentication** → **URL Configuration**:
   - Set **Site URL** to `http://localhost:3000`
   - Add `http://localhost:3000/**` to **Redirect URLs**

### 5. Create a Staff User

By default, all users are created as "student" role. To test staff features:

1. Sign up for an account at http://localhost:3003/signup
2. Go to Supabase Dashboard → **Table Editor** → **profiles**
3. Find your user and change the `role` from `student` to `staff`

## 🎯 Test the Application

### Test User Registration & Sign In

1. **Browse Devices (Public)**: http://localhost:3003/devices
   - Should show all devices without authentication

2. **Sign Up**: http://localhost:3003/signup
   - Create a new account
   - Should auto-redirect to /devices after signup

3. **Sign In**: http://localhost:3003/signin
   - Sign in with your credentials
   - Should redirect to /devices

### Test Device Reservations (Student Role)

1. Sign in as a student
2. Go to http://localhost:3003/devices
3. Click "Reserve" on any available device
4. Go to http://localhost:3003/reservations to see your reservations
5. Check your email for reservation confirmation (if Resend is configured)

### Test Staff Features (Staff Role)

1. Change your user role to "staff" in Supabase (see step 5 above)
2. Go to http://localhost:3003/staff
3. Test marking devices as collected
4. Test marking devices as returned
5. Check email notifications for collection/return confirmations

## 🏗️ What Was Changed

### Removed
- ❌ Auth0 authentication
- ❌ SMTP email service (Nodemailer)
- ❌ `app/api/auth/[auth0]/route.ts`
- ❌ `lib/auth/config.ts`

### Added
- ✅ Supabase Auth with automatic profile creation
- ✅ Resend email service
- ✅ `lib/auth/supabase-server.ts` - Server-side auth
- ✅ `lib/auth/supabase-client.ts` - Client-side auth
- ✅ `lib/email/resend-service.ts` - Email service
- ✅ `app/signin/page.tsx` - Sign in page
- ✅ `app/signup/page.tsx` - Sign up page
- ✅ `supabase/seed.sql` - Sample data

### Updated
- 🔄 All frontend components (devices, reservations, staff pages)
- 🔄 Middleware RBAC (`lib/middleware/rbac.ts`)
- 🔄 API routes for staff operations
- 🔄 Database schema (users → profiles)
- 🔄 CI/CD workflow environment variables
- 🔄 Vercel configuration

## 🐛 Troubleshooting

### Issue: Can't sign in
- Check that Supabase Email provider is enabled
- Check that Site URL is set to `http://localhost:3000`
- Check browser console for errors

### Issue: No email notifications
- Verify `RESEND_API_KEY` is set in `.env.local`
- Check Resend dashboard for email logs
- For development, you can use Resend's test domain

### Issue: Permission denied errors
- Check user role in Supabase `profiles` table
- Staff features require role='staff'
- Student features require authenticated user

## 📚 Next Steps

1. **Run the seed script** to add sample devices
2. **Get Resend API key** to enable email notifications
3. **Create a staff user** to test staff features
4. **Test the complete flow**: Sign up → Reserve device → Staff collects → Staff returns

## 🚀 Deployment

When deploying to Vercel:

1. Add all environment variables in Vercel dashboard
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Update Supabase Site URL and Redirect URLs to production URLs
4. Configure Resend to use your own domain (optional)

---

**Dev Server**: http://localhost:3003
**Status**: ✅ Running without errors
