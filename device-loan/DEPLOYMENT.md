# Deployment Guide

This guide walks you through deploying the Campus Device Loan Management System to production.

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Supabase account and project created
- [ ] Auth0 account and application configured
- [ ] Vercel account
- [ ] GitHub repository set up
- [ ] SMTP server credentials (Gmail, SendGrid, etc.)

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and set project name
4. Set a strong database password (save it securely)
5. Select a region close to your users

### 1.2 Run Migrations

1. Navigate to SQL Editor in Supabase dashboard
2. Run migrations in order:
   - Copy contents of `supabase/migrations/00001_initial_schema.sql`
   - Click "Run"
   - Repeat for `00002_reservation_function.sql`
   - (Optional) Run `00003_seed_data.sql` for demo data

### 1.3 Get API Keys

1. Go to Project Settings > API
2. Copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`) - Keep this secret!

## Step 2: Auth0 Setup

### 2.1 Create Application

1. Go to [auth0.com](https://auth0.com) dashboard
2. Applications > Create Application
3. Choose "Regular Web Application"
4. Click "Create"

### 2.2 Configure Application

In the application settings:

1. **Application URIs**:
   - Allowed Callback URLs:
     ```
     http://localhost:3000/api/auth/callback,
     https://your-domain.vercel.app/api/auth/callback
     ```
   - Allowed Logout URLs:
     ```
     http://localhost:3000,
     https://your-domain.vercel.app
     ```
   - Allowed Web Origins:
     ```
     http://localhost:3000,
     https://your-domain.vercel.app
     ```

2. Save changes

3. Copy credentials:
   - Domain (`AUTH0_ISSUER_BASE_URL` = `https://YOUR_DOMAIN.auth0.com`)
   - Client ID (`AUTH0_CLIENT_ID`)
   - Client Secret (`AUTH0_CLIENT_SECRET`)

### 2.3 Add Role Claim (Important!)

1. Go to Actions > Flows > Login
2. Click "+" to add custom action
3. Name it "Add Role Claim"
4. Add this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://deviceloans.edu';
  const role = event.user.app_metadata?.role || 'student';
  api.idToken.setCustomClaim(`${namespace}/role`, role);
};
```

5. Deploy and add to Login flow

### 2.4 Set User Roles

For staff users:

1. Go to User Management > Users
2. Select a user
3. Click "Metadata"
4. Add to `app_metadata`:
```json
{
  "role": "staff"
}
```

## Step 3: Email Configuration

### Option A: Gmail

1. Enable 2FA on your Google account
2. Generate an App Password:
   - Google Account > Security > 2-Step Verification > App passwords
3. Use these values:
   - `SMTP_HOST`: smtp.gmail.com
   - `SMTP_PORT`: 587
   - `SMTP_USER`: your.email@gmail.com
   - `SMTP_PASSWORD`: your-app-password

### Option B: SendGrid

1. Create SendGrid account
2. Create API key
3. Use these values:
   - `SMTP_HOST`: smtp.sendgrid.net
   - `SMTP_PORT`: 587
   - `SMTP_USER`: apikey
   - `SMTP_PASSWORD`: your-sendgrid-api-key

## Step 4: Vercel Deployment

### 4.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Framework Preset: Next.js (auto-detected)

### 4.2 Configure Environment Variables

Add all environment variables in Vercel dashboard (Settings > Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Auth0
AUTH0_SECRET=use-openssl-rand-hex-32-to-generate-this
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxx
AUTH0_CLIENT_SECRET=xxxxxxxxxxxxxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Device Loans <noreply@deviceloans.edu>

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
DEFAULT_LOAN_DURATION_DAYS=2
LOG_LEVEL=info
```

**Important**: Set environment variables for all environments (Production, Preview, Development)

### 4.3 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Note your deployment URL

### 4.4 Update Auth0 URLs

Go back to Auth0 and update the callback URLs with your actual Vercel URL.

## Step 5: GitHub Actions Setup

### 5.1 Add Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions:

Add these secrets:
- `VERCEL_TOKEN`: Get from Vercel Account Settings > Tokens
- `VERCEL_ORG_ID`: Find in Vercel Team Settings
- `VERCEL_PROJECT_ID`: Find in Vercel Project Settings

### 5.2 Create Branches

```bash
git checkout -b develop
git push origin develop

git checkout main
git push origin main
```

Now pushes to:
- `develop` → Auto-deploy to test environment
- `main` → Auto-deploy to staging, then production (with approval)

## Step 6: Post-Deployment Verification

### 6.1 Health Checks

```bash
# Check health
curl https://your-app.vercel.app/api/health

# Check readiness
curl https://your-app.vercel.app/api/health/ready
```

Expected responses should show status: "healthy" and ready: true

### 6.2 Test Authentication

1. Visit your deployed app
2. Click "Sign In"
3. Create a test account
4. Verify you can see devices

### 6.3 Test Reservation Flow

1. Sign in as a student
2. Reserve a device
3. Check that you receive email confirmation
4. View "My Reservations"

### 6.4 Test Staff Functions

1. Set a user's role to "staff" in Auth0
2. Sign in as that user
3. Go to `/staff`
4. Test marking devices as collected/returned

## Step 7: Monitoring & Observability

### 7.1 Vercel Analytics

Enable in Vercel dashboard under Analytics tab.

### 7.2 Error Tracking

Consider integrating:
- Sentry for error tracking
- LogDNA/Datadog for log aggregation

### 7.3 Database Monitoring

In Supabase dashboard:
- Monitor API usage
- Check database performance
- Review logs

## Troubleshooting

### Issue: "Authentication required" on all pages

**Solution**: Check that Auth0 environment variables are correct and Auth0 application URLs match your deployment URL.

### Issue: Database connection errors

**Solution**:
- Verify Supabase URL and keys are correct
- Check that migrations have been run
- Ensure Row Level Security policies are in place

### Issue: Email notifications not sending

**Solution**:
- Verify SMTP credentials
- Check SMTP_FROM is a valid email format
- For Gmail, ensure App Password is used (not regular password)
- Check Vercel logs for email errors

### Issue: "No available devices" when devices exist

**Solution**:
- Check that reservation function was created (`00002_reservation_function.sql`)
- Verify devices have `is_available = true`
- Check for orphaned active loans

### Issue: CORS errors

**Solution**: Ensure `NEXT_PUBLIC_APP_URL` matches your actual deployment URL.

## Production Checklist

Before going live:

- [ ] All environment variables configured correctly
- [ ] Database migrations run successfully
- [ ] Seed data loaded (if desired)
- [ ] Auth0 configured with production URLs
- [ ] Email notifications working
- [ ] Health checks passing
- [ ] Test account can sign in and reserve device
- [ ] Staff account can mark devices collected/returned
- [ ] CI/CD pipeline running successfully
- [ ] Monitoring and logging enabled
- [ ] Backup strategy in place for database
- [ ] Domain configured (if using custom domain)

## Scaling Considerations

As usage grows:

1. **Database**: Upgrade Supabase plan for more connections
2. **Email**: Consider transactional email service (SendGrid, AWS SES)
3. **Caching**: Add Redis for session storage and caching
4. **CDN**: Vercel handles this automatically
5. **Rate Limiting**: Implement API rate limiting
6. **Database Indexing**: Monitor slow queries and add indexes

## Security Hardening

1. **Enable 2FA**: For all admin accounts (Vercel, Supabase, Auth0)
2. **Audit Logs**: Regularly review audit logs in the database
3. **Key Rotation**: Rotate API keys and secrets quarterly
4. **Dependency Updates**: Keep dependencies up to date
5. **Penetration Testing**: Conduct before production launch

## Support

For deployment issues:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Auth0: [auth0.com/docs](https://auth0.com/docs)

---

**Ready to deploy!** Follow this guide step-by-step, and you'll have a production-ready device loan management system.
