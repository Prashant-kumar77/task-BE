# LearnLynk - Technical Assessment

A multi-tenant task management system built with Supabase Postgres, Edge Functions, and Next.js.

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Deno (for Edge Functions, or use npx)

### Step 1: Database Setup (5 minutes)

1. Go to your Supabase Dashboard
2. Open **SQL Editor** → **New Query**
3. Run `backend/schema.sql`
4. Run `backend/rls_policies.sql`
5. Run `backend/seed_data_ready.sql` (to populate test data - update with your user IDs)

### Step 2: Frontend Setup (2 minutes)

1. Navigate to the frontend directory:
   ```bash
   cd my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   
   > Get these values from your Supabase Dashboard → Project Settings → API

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Step 3: Edge Function Setup (Optional - 5 minutes)

The Edge Function is used for creating tasks via API. To deploy:

1. Login to Supabase:
   ```bash
   npx supabase login
   ```

2. Link your project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
   
   > Get your project ref from Supabase Dashboard → Project Settings

3. Deploy the function:
   ```bash
   npx supabase functions deploy create-task
   ```

4. Set environment variables in Supabase Dashboard:
   - Go to **Project Settings** → **Edge Functions** → **Environment Variables**
   - Add `SUPABASEURL`: `https://your-project.supabase.co`
   - Add `SUPABASESERVICE_ROLE_KEY`: (Get from **Project Settings** → **API** → **service_role** key)

## 👤 Test User Credentials

Create test users in Supabase Auth (Authentication → Users) with these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `123456` |
| **Counselor** | `counselor@example.com` | `123456` |

> **Note**: After creating users, update `backend/seed_data_ready.sql` with the actual user IDs from `auth.users` table.

## 📁 Project Structure

```
.
├── backend/
│   ├── schema.sql              # Database schema
│   ├── rls_policies.sql        # Row-Level Security policies
│   ├── seed_data_ready.sql     # Seed data with test users
│   └── edge-functions/
│       └── create-task/
│           └── index.ts        # Edge Function for creating tasks
└── my-app/                     # Next.js frontend (main app)
    ├── app/
    │   ├── login/              # Authentication pages
    │   ├── dashboard/
    │   │   ├── today/          # Today's tasks page
    │   │   ├── tasks/          # All tasks & create task
    │   │   ├── leads/          # Leads management
    │   │   └── applications/   # Applications management
    │   └── layout.tsx          # Root layout with providers
    ├── components/
    │   ├── Navbar.tsx          # Navigation bar
    │   └── ProtectedRoute.tsx  # Route protection wrapper
    └── lib/
        ├── supabase.ts         # Supabase client
        ├── auth-context.tsx    # Authentication context
        └── query-client.tsx    # React Query provider
```

## ✨ Features

### Authentication
- Login/Signup with Supabase Auth
- Protected routes for all dashboard pages
- Automatic session management

### Task Management
- **Today's Tasks**: View and manage tasks due today
- **All Tasks**: View all tasks with filtering by status and type
- **Create Task**: Form to create new tasks via Edge Function API
- **Mark Complete**: Update task status to completed

### Lead Management
- View all leads with details
- Create new leads with owner and stage
- Filter applications by lead

### Application Management
- View all applications
- Create applications linked to leads
- Quick link to create tasks for applications
- Filter by lead

## 🔧 Configuration

### Environment Variables

**Frontend** (`my-app/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> Get these from: Supabase Dashboard → Project Settings → API

**Edge Function** (Set in Supabase Dashboard → Edge Functions → Environment Variables):
- `SUPABASEURL`: `https://your-project.supabase.co`
- `SUPABASESERVICE_ROLE_KEY`: (Get from Project Settings → API → service_role key)

## 📡 API Endpoint

### Create Task
- **URL**: `https://your-project.supabase.co/functions/v1/create-task`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer your-anon-key`
- **Body**:
  ```json
  {
    "application_id": "uuid",
    "task_type": "call",
    "due_at": "2025-01-01T12:00:00Z"
  }
  ```

## 🗄️ Database Schema

The database includes:
- **users**: User accounts with roles (admin, counselor)
- **teams**: Team management
- **user_teams**: User-team relationships
- **leads**: Lead records with owner and stage
- **applications**: Applications linked to leads
- **tasks**: Tasks linked to applications (types: call, email, review)

## 🔐 Row-Level Security (RLS)

RLS policies enforce:
- **Admins**: Can see all leads in their tenant
- **Counselors**: Can see leads they own OR leads from team members
- All users can only access data from their tenant

## 📝 Stripe Integration (Written Answer)

To implement a Stripe Checkout flow for an application fee:

**Payment Request Creation**: When a user initiates payment for an application, insert a `payment_requests` row with fields like `application_id`, `amount`, `currency`, `status` (pending), and `stripe_checkout_session_id` (initially null). This creates an audit trail before calling Stripe.

**Stripe Checkout Session**: Call Stripe's API to create a Checkout Session using the Stripe server-side SDK, passing the application fee amount, success/cancel URLs, and metadata containing the `application_id` and `payment_request_id`. Store the returned `session_id` in the `payment_requests` row for tracking.

**Session Storage**: Store the `checkout_session_id`, `customer_email`, `amount`, `currency`, and `status` from the Stripe session in the `payment_requests` table. This allows querying payment status without hitting Stripe's API repeatedly.

**Webhook Handling**: Set up a Supabase Edge Function or Next.js API route to receive Stripe webhooks. Verify the webhook signature using Stripe's secret, then handle `checkout.session.completed` events. When payment succeeds, update the `payment_requests` row status to 'completed' and update the corresponding `applications` row, potentially setting a `payment_status` field to 'paid' and `paid_at` timestamp.

**Application Update**: After successful payment verification via webhook, update the application record with payment confirmation, ensuring idempotency by checking if the payment was already processed to prevent duplicate updates from webhook retries.

## 🐛 Troubleshooting

### Authentication Issues
- If you get "Invalid login credentials", check that email confirmation is disabled in Supabase Auth settings (for development)
- Verify your `.env.local` file has the correct Supabase URL and anon key
- Restart the dev server after changing environment variables

### No Data Showing
- Make sure you've run `backend/seed_data_ready.sql` to populate test data
- Verify you're logged in with one of the test users
- Check that the tenant_id matches between users and data

### Edge Function Not Working
- Verify environment variables are set in Supabase Dashboard
- Check that the function is deployed: `npx supabase functions list`
- Ensure you're using the service_role key (not anon key) for the function

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
