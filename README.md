# Campus Device Loan Management System

A comprehensive device loan management system built with Next.js, Supabase, and Auth0 for campus IT departments to manage device loans to students.

## Features

### For Students
- 🔍 Browse available devices (laptops, tablets, cameras)
- 🔐 Secure authentication via Auth0
- 📅 Reserve devices with automatic due date assignment
- 📧 Email notifications for reservations, collections, and returns
- 🔔 Join waitlists and get notified when devices become available
- 📊 View loan history and current reservations

### For Staff
- ✅ Mark devices as collected or returned
- 📋 View all active and past loans
- 🔒 Role-based access control (RBAC)
- 📝 Complete audit trail of all actions

### Technical Features
- 🔒 **Security**: JWT-based authentication, RBAC, TLS encryption
- 🎯 **Concurrency**: Atomic reservation handling with database locks
- 🛡️ **Resilience**: Graceful error handling and degradation
- 📊 **Observability**: Structured logging with correlation IDs
- 🚀 **Scalability**: Serverless architecture on Vercel
- 🧪 **Testability**: Comprehensive unit and integration tests
- 🚀 **DevOps**: Automated CI/CD with GitHub Actions

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Auth0 (OAuth2/OIDC)
- **Email**: Nodemailer (SMTP)
- **Logging**: Pino (structured logging)
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

### Database Schema
- **users**: User accounts with role information
- **device_models**: Device specifications (brand, model, category)
- **devices**: Individual device instances with serial numbers
- **loans**: Reservation and loan records
- **waitlist**: Waitlist subscriptions for device models
- **audit_logs**: Complete audit trail with correlation IDs

## Getting Started

### Prerequisites
- Node.js 20.x or later
- npm or yarn
- Supabase account
- Auth0 account
- SMTP server for emails (e.g., Gmail)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd device-loan
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables in `.env.local`:
   - Set up Supabase URL and keys
   - Configure Auth0 credentials
   - Set SMTP server details

### Database Setup

1. Create a new Supabase project

2. Run migrations in order:
```bash
# In Supabase SQL Editor
-- Run 00001_initial_schema.sql
-- Run 00002_reservation_function.sql
-- Run 00003_seed_data.sql (optional, for demo data)
```

### Auth0 Setup

1. Create a new Auth0 application (Regular Web Application)

2. Configure:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

3. Add a custom action to add role claim:
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://deviceloans.edu';
  api.idToken.setCustomClaim(`${namespace}/role`, event.user.app_metadata.role || 'student');
};
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run tests:
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Building

Build for production:
```bash
npm run build
```

## API Endpoints

### Public Endpoints
- `GET /api/devices` - List all device models with availability

### Authenticated Endpoints
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations` - Get user's reservations
- `POST /api/waitlist` - Subscribe to waitlist
- `GET /api/waitlist` - Get user's waitlist subscriptions
- `DELETE /api/waitlist` - Unsubscribe from waitlist

### Staff Endpoints (RBAC)
- `POST /api/staff/collect` - Mark device as collected
- `POST /api/staff/return` - Mark device as returned

### System Endpoints
- `GET /api/health` - Health check with database and auth status
- `GET /api/health/ready` - Readiness check for load balancer

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

4. Configure GitHub integration for automatic deployments

### Environment Configuration

The system supports multiple environments:
- **Development**: `.env.local`
- **Test**: Vercel test environment
- **Staging**: Vercel staging environment
- **Production**: Vercel production environment

## CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Lint**: ESLint checks
2. **Test**: Unit and integration tests with coverage
3. **Build**: Production build verification
4. **Deploy to Test**: Auto-deploy from `develop` branch
5. **Deploy to Staging**: Auto-deploy from `main` branch
6. **Deploy to Production**: Gated deployment with approval

## Security

- **Authentication**: Auth0 with OAuth2/OIDC
- **Authorization**: Role-based access control (RBAC)
- **Transport**: TLS for all external traffic
- **Database**: Row-level security policies
- **API**: JWT validation on all protected endpoints
- **Audit**: Complete audit trail with correlation IDs

## Observability

- **Logging**: Structured JSON logs with Pino
- **Correlation IDs**: Request tracking across services
- **Health Checks**: `/api/health` and `/api/health/ready`
- **Metrics**: Request duration logging
- **Error Tracking**: Comprehensive error logging

## Concurrency Handling

The reservation system uses PostgreSQL's `FOR UPDATE SKIP LOCKED` to handle concurrent reservations:

```sql
SELECT d.id FROM devices d
WHERE d.device_model_id = p_device_model_id
AND d.is_available = TRUE
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

This ensures atomic reservations even under high concurrency.

## Email Notifications

Users receive emails for:
- ✅ Reservation confirmation
- 📦 Device collection confirmation
- ✅ Device return confirmation
- 🔔 Device availability notifications (waitlist)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

This project is licensed for educational purposes.

## Support

For issues and questions, please contact Campus IT Support or create an issue in the repository.

## Acknowledgments

Built as a student project for campus device loan management.
