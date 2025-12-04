-- Seed Data for LearnLynk Application
-- Run this after running schema.sql and rls_policies.sql

-- Insert Users
-- Note: In production, users would be created through Supabase Auth
-- For seed data, we'll create entries that match auth.users structure
-- You may need to adjust these based on your actual auth.users table

-- Insert Teams
INSERT INTO teams (id, tenant_id, name, created_at, updated_at)
VALUES
  (gen_random_uuid(), gen_random_uuid(), 'Sales Team', now(), now()),
  (gen_random_uuid(), gen_random_uuid(), 'Support Team', now(), now()),
  (gen_random_uuid(), gen_random_uuid(), 'Marketing Team', now(), now())
ON CONFLICT DO NOTHING;

-- Get team IDs for reference (you'll need to adjust these after running)
-- For now, we'll use a subquery approach

-- Insert Users (assuming you have auth users created)
-- Note: Replace these UUIDs with actual user IDs from auth.users table
-- Or create auth users first, then use their IDs here

-- Example: If you have auth users, you can insert like this:
-- INSERT INTO users (id, tenant_id, role, created_at, updated_at)
-- VALUES
--   ('user-uuid-1', 'tenant-uuid-1', 'admin', now(), now()),
--   ('user-uuid-2', 'tenant-uuid-1', 'counselor', now(), now()),
--   ('user-uuid-3', 'tenant-uuid-1', 'counselor', now(), now())
-- ON CONFLICT DO NOTHING;

-- For demonstration, let's create a helper function to get or create tenant
DO $$
DECLARE
  v_tenant_id uuid := gen_random_uuid();
  v_team1_id uuid;
  v_team2_id uuid;
  v_team3_id uuid;
  v_user1_id uuid;
  v_user2_id uuid;
  v_user3_id uuid;
  v_lead1_id uuid;
  v_lead2_id uuid;
  v_lead3_id uuid;
  v_app1_id uuid;
  v_app2_id uuid;
  v_app3_id uuid;
BEGIN
  -- Create teams
  INSERT INTO teams (id, tenant_id, name, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Sales Team', now(), now()),
    (gen_random_uuid(), v_tenant_id, 'Support Team', now(), now()),
    (gen_random_uuid(), v_tenant_id, 'Marketing Team', now(), now())
  RETURNING id INTO v_team1_id, v_team2_id, v_team3_id;

  -- Get team IDs
  SELECT id INTO v_team1_id FROM teams WHERE name = 'Sales Team' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_team2_id FROM teams WHERE name = 'Support Team' AND tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_team3_id FROM teams WHERE name = 'Marketing Team' AND tenant_id = v_tenant_id LIMIT 1;

  -- Create users (you'll need to replace these with actual auth user IDs)
  -- For now, we'll generate UUIDs - in production, use actual auth.users.id
  v_user1_id := gen_random_uuid();
  v_user2_id := gen_random_uuid();
  v_user3_id := gen_random_uuid();

  INSERT INTO users (id, tenant_id, role, created_at, updated_at)
  VALUES
    (v_user1_id, v_tenant_id, 'admin', now(), now()),
    (v_user2_id, v_tenant_id, 'counselor', now(), now()),
    (v_user3_id, v_tenant_id, 'counselor', now(), now())
  ON CONFLICT DO NOTHING;

  -- Link users to teams
  INSERT INTO user_teams (user_id, team_id, created_at)
  VALUES
    (v_user2_id, v_team1_id, now()),
    (v_user3_id, v_team1_id, now()),
    (v_user2_id, v_team2_id, now())
  ON CONFLICT DO NOTHING;

  -- Create leads
  INSERT INTO leads (id, tenant_id, owner_id, stage, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_user2_id, 'qualified', now() - interval '5 days', now() - interval '5 days'),
    (gen_random_uuid(), v_tenant_id, v_user2_id, 'contacted', now() - interval '3 days', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_user3_id, 'proposal', now() - interval '2 days', now()),
    (gen_random_uuid(), v_tenant_id, v_user3_id, 'negotiation', now() - interval '1 day', now())
  RETURNING id INTO v_lead1_id, v_lead2_id, v_lead3_id, NULL;

  -- Get lead IDs
  SELECT id INTO v_lead1_id FROM leads WHERE tenant_id = v_tenant_id AND stage = 'qualified' LIMIT 1;
  SELECT id INTO v_lead2_id FROM leads WHERE tenant_id = v_tenant_id AND stage = 'contacted' LIMIT 1;
  SELECT id INTO v_lead3_id FROM leads WHERE tenant_id = v_tenant_id AND stage = 'proposal' LIMIT 1;

  -- Create applications
  INSERT INTO applications (id, tenant_id, lead_id, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_lead1_id, now() - interval '4 days', now() - interval '4 days'),
    (gen_random_uuid(), v_tenant_id, v_lead2_id, now() - interval '2 days', now() - interval '2 days'),
    (gen_random_uuid(), v_tenant_id, v_lead3_id, now() - interval '1 day', now() - interval '1 day')
  RETURNING id INTO v_app1_id, v_app2_id, v_app3_id;

  -- Get application IDs
  SELECT id INTO v_app1_id FROM applications WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO v_app2_id FROM applications WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO v_app3_id FROM applications WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 2;

  -- Create tasks
  INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
  VALUES
    -- Tasks due today
    (gen_random_uuid(), v_tenant_id, v_app1_id, 'call', now() + interval '2 hours', 'pending', now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_app2_id, 'email', now() + interval '5 hours', 'pending', now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_app3_id, 'review', now() + interval '8 hours', 'pending', now() - interval '12 hours', now() - interval '12 hours'),
    -- Tasks due tomorrow
    (gen_random_uuid(), v_tenant_id, v_app1_id, 'call', now() + interval '1 day', 'pending', now() - interval '2 days', now() - interval '2 days'),
    (gen_random_uuid(), v_tenant_id, v_app2_id, 'email', now() + interval '1 day' + interval '3 hours', 'pending', now() - interval '2 days', now() - interval '2 days'),
    -- Completed tasks
    (gen_random_uuid(), v_tenant_id, v_app3_id, 'review', now() - interval '1 day', 'completed', now() - interval '3 days', now() - interval '1 day'),
    -- Future tasks
    (gen_random_uuid(), v_tenant_id, v_app1_id, 'call', now() + interval '3 days', 'pending', now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_app2_id, 'email', now() + interval '5 days', 'pending', now() - interval '2 days', now() - interval '2 days')
  ON CONFLICT DO NOTHING;

END $$;

-- Alternative simpler approach if the above doesn't work:
-- This creates seed data using direct inserts with known relationships

-- First, let's create a simple seed script that you can run after creating auth users
-- Uncomment and modify the following based on your actual auth user IDs:

/*
-- Step 1: Create a tenant (you can use any UUID or generate one)
-- Replace 'your-tenant-id' with an actual UUID
DO $$
DECLARE
  v_tenant_id uuid := 'your-tenant-id'::uuid;
  v_user1_id uuid := 'your-auth-user-1-id'::uuid;  -- Replace with actual auth user ID
  v_user2_id uuid := 'your-auth-user-2-id'::uuid;  -- Replace with actual auth user ID
  v_lead1_id uuid;
  v_lead2_id uuid;
  v_app1_id uuid;
  v_app2_id uuid;
BEGIN
  -- Create teams
  INSERT INTO teams (tenant_id, name) VALUES
    (v_tenant_id, 'Sales Team'),
    (v_tenant_id, 'Support Team');

  -- Create users (if not exists)
  INSERT INTO users (id, tenant_id, role) VALUES
    (v_user1_id, v_tenant_id, 'admin'),
    (v_user2_id, v_tenant_id, 'counselor')
  ON CONFLICT (id) DO NOTHING;

  -- Create leads
  INSERT INTO leads (tenant_id, owner_id, stage) VALUES
    (v_tenant_id, v_user2_id, 'qualified'),
    (v_tenant_id, v_user2_id, 'contacted')
  RETURNING id INTO v_lead1_id, v_lead2_id;

  -- Create applications
  INSERT INTO applications (tenant_id, lead_id) VALUES
    (v_tenant_id, v_lead1_id),
    (v_tenant_id, v_lead2_id)
  RETURNING id INTO v_app1_id, v_app2_id;

  -- Create tasks
  INSERT INTO tasks (tenant_id, application_id, type, due_at, status) VALUES
    (v_tenant_id, v_app1_id, 'call', now() + interval '2 hours', 'pending'),
    (v_tenant_id, v_app2_id, 'email', now() + interval '5 hours', 'pending'),
    (v_tenant_id, v_app1_id, 'review', now() + interval '1 day', 'pending');
END $$;
*/

