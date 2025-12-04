-- Simple Seed Data Script for LearnLynk
-- IMPORTANT: Before running this, you need to:
-- 1. Create users in Supabase Auth (Authentication > Users > Add User)
-- 2. Note down the user IDs from auth.users table
-- 3. Replace the placeholder UUIDs below with your actual user IDs

-- This script creates sample data for testing the application

-- Step 1: Set your tenant ID (use the same for all related data)
-- You can generate one at: https://www.uuidgenerator.net/
-- Or use: SELECT gen_random_uuid();

-- Step 2: Replace these with your actual auth user IDs from Supabase Auth
-- Go to: Authentication > Users, and copy the user IDs
\set tenant_id '00000000-0000-0000-0000-000000000001'  -- Replace with your tenant UUID
\set admin_user_id '00000000-0000-0000-0000-000000000002'  -- Replace with admin user ID from auth.users
\set counselor_user_id '00000000-0000-0000-0000-000000000003'  -- Replace with counselor user ID from auth.users

-- Create Teams
INSERT INTO teams (id, tenant_id, name, created_at, updated_at)
VALUES
  (gen_random_uuid(), :'tenant_id'::uuid, 'Sales Team', now(), now()),
  (gen_random_uuid(), :'tenant_id'::uuid, 'Support Team', now(), now()),
  (gen_random_uuid(), :'tenant_id'::uuid, 'Marketing Team', now(), now())
ON CONFLICT DO NOTHING;

-- Create Users (link to your auth users)
-- IMPORTANT: Replace the UUIDs below with actual IDs from auth.users table
INSERT INTO users (id, tenant_id, role, created_at, updated_at)
VALUES
  (:'admin_user_id'::uuid, :'tenant_id'::uuid, 'admin', now(), now()),
  (:'counselor_user_id'::uuid, :'tenant_id'::uuid, 'counselor', now(), now())
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  role = EXCLUDED.role;

-- Link users to teams
INSERT INTO user_teams (user_id, team_id, created_at)
SELECT 
  u.id,
  t.id,
  now()
FROM users u
CROSS JOIN teams t
WHERE u.tenant_id = :'tenant_id'::uuid
  AND t.tenant_id = :'tenant_id'::uuid
  AND t.name = 'Sales Team'
  AND u.role = 'counselor'
ON CONFLICT DO NOTHING;

-- Create Leads
WITH lead_data AS (
  INSERT INTO leads (id, tenant_id, owner_id, stage, created_at, updated_at)
  VALUES
    (gen_random_uuid(), :'tenant_id'::uuid, :'counselor_user_id'::uuid, 'qualified', now() - interval '5 days', now() - interval '5 days'),
    (gen_random_uuid(), :'tenant_id'::uuid, :'counselor_user_id'::uuid, 'contacted', now() - interval '3 days', now() - interval '1 day'),
    (gen_random_uuid(), :'tenant_id'::uuid, :'counselor_user_id'::uuid, 'proposal', now() - interval '2 days', now()),
    (gen_random_uuid(), :'tenant_id'::uuid, :'counselor_user_id'::uuid, 'negotiation', now() - interval '1 day', now())
  RETURNING id, lead_id
)
SELECT id FROM lead_data;

-- Create Applications (linked to leads)
INSERT INTO applications (id, tenant_id, lead_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  :'tenant_id'::uuid,
  l.id,
  l.created_at + interval '1 day',
  l.updated_at
FROM leads l
WHERE l.tenant_id = :'tenant_id'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM applications a WHERE a.lead_id = l.id
  )
LIMIT 4;

-- Create Tasks (linked to applications)
-- Tasks due today
INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  :'tenant_id'::uuid,
  a.id,
  task_type,
  CASE 
    WHEN task_type = 'call' THEN now() + interval '2 hours'
    WHEN task_type = 'email' THEN now() + interval '5 hours'
    WHEN task_type = 'review' THEN now() + interval '8 hours'
  END,
  'pending',
  now() - interval '1 day',
  now() - interval '1 day'
FROM applications a
CROSS JOIN (VALUES ('call'), ('email'), ('review')) AS types(task_type)
WHERE a.tenant_id = :'tenant_id'::uuid
LIMIT 3;

-- Tasks due tomorrow
INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  :'tenant_id'::uuid,
  a.id,
  'call',
  now() + interval '1 day' + interval '2 hours',
  'pending',
  now() - interval '2 days',
  now() - interval '2 days'
FROM applications a
WHERE a.tenant_id = :'tenant_id'::uuid
LIMIT 2;

-- Completed tasks
INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  :'tenant_id'::uuid,
  a.id,
  'review',
  now() - interval '1 day',
  'completed',
  now() - interval '3 days',
  now() - interval '1 day'
FROM applications a
WHERE a.tenant_id = :'tenant_id'::uuid
LIMIT 1;

-- Future tasks
INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  :'tenant_id'::uuid,
  a.id,
  CASE (ROW_NUMBER() OVER ())::int % 2
    WHEN 0 THEN 'call'
    ELSE 'email'
  END,
  now() + interval '3 days' + (ROW_NUMBER() OVER () * interval '1 day'),
  'pending',
  now() - interval '1 day',
  now() - interval '1 day'
FROM applications a
WHERE a.tenant_id = :'tenant_id'::uuid
LIMIT 2;

