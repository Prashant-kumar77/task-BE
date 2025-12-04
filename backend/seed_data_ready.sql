-- Seed Data for LearnLynk
-- IMPORTANT: Replace the placeholder UUIDs below with your actual values
-- 1. Get your user IDs from: SELECT id, email FROM auth.users;
-- 2. Generate a tenant UUID or use: SELECT gen_random_uuid();

DO $$
DECLARE
  -- REPLACE THESE WITH YOUR ACTUAL VALUES
  v_tenant_id uuid := 'REPLACE-WITH-TENANT-UUID'::uuid;
  v_admin_id uuid := 'REPLACE-WITH-ADMIN-USER-ID'::uuid;
  v_counselor_id uuid := 'REPLACE-WITH-COUNSELOR-USER-ID'::uuid;
  
  -- Variables for storing IDs
  v_team1_id uuid;
  v_team2_id uuid;
  v_lead1_id uuid;
  v_lead2_id uuid;
  v_lead3_id uuid;
  v_app1_id uuid;
  v_app2_id uuid;
  v_app3_id uuid;
BEGIN
  -- Create Teams
  INSERT INTO teams (id, tenant_id, name, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'Sales Team', now(), now()),
    (gen_random_uuid(), v_tenant_id, 'Support Team', now(), now())
  ON CONFLICT DO NOTHING;
  
  -- Get team IDs
  SELECT id INTO v_team1_id FROM teams WHERE tenant_id = v_tenant_id AND name = 'Sales Team' LIMIT 1;
  SELECT id INTO v_team2_id FROM teams WHERE tenant_id = v_tenant_id AND name = 'Support Team' LIMIT 1;

  -- Create Users (link to auth users)
  INSERT INTO users (id, tenant_id, role, created_at, updated_at)
  VALUES
    (v_admin_id, v_tenant_id, 'admin', now(), now()),
    (v_counselor_id, v_tenant_id, 'counselor', now(), now())
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role;

  -- Link counselor to teams
  INSERT INTO user_teams (user_id, team_id, created_at)
  SELECT v_counselor_id, id, now()
  FROM teams
  WHERE tenant_id = v_tenant_id
  ON CONFLICT DO NOTHING;

  -- Create Leads
  INSERT INTO leads (id, tenant_id, owner_id, stage, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_counselor_id, 'qualified', now() - interval '5 days', now() - interval '5 days'),
    (gen_random_uuid(), v_tenant_id, v_counselor_id, 'contacted', now() - interval '3 days', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_counselor_id, 'proposal', now() - interval '2 days', now()),
    (gen_random_uuid(), v_tenant_id, v_counselor_id, 'negotiation', now() - interval '1 day', now())
  ON CONFLICT DO NOTHING;

  -- Get lead IDs
  SELECT id INTO v_lead1_id FROM leads WHERE tenant_id = v_tenant_id AND stage = 'qualified' LIMIT 1;
  SELECT id INTO v_lead2_id FROM leads WHERE tenant_id = v_tenant_id AND stage = 'contacted' LIMIT 1;
  SELECT id INTO v_lead3_id FROM leads WHERE tenant_id = v_tenant_id AND stage = 'proposal' LIMIT 1;

  -- Create Applications
  INSERT INTO applications (id, tenant_id, lead_id, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    v_tenant_id,
    id,
    created_at + interval '1 day',
    updated_at
  FROM leads
  WHERE tenant_id = v_tenant_id
    AND id IN (v_lead1_id, v_lead2_id, v_lead3_id)
  ON CONFLICT DO NOTHING;

  -- Get application IDs
  SELECT id INTO v_app1_id FROM applications WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO v_app2_id FROM applications WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO v_app3_id FROM applications WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1 OFFSET 2;

  -- Create Tasks
  -- Tasks due TODAY (for testing the Today page)
  INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_app1_id, 'call', 
     date_trunc('day', now()) + interval '2 hours', 'pending', 
     now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_app2_id, 'email', 
     date_trunc('day', now()) + interval '5 hours', 'pending', 
     now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_app3_id, 'review', 
     date_trunc('day', now()) + interval '8 hours', 'pending', 
     now() - interval '12 hours', now() - interval '12 hours')
  ON CONFLICT DO NOTHING;

  -- Tasks due TOMORROW
  INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_app1_id, 'call', 
     date_trunc('day', now()) + interval '1 day' + interval '2 hours', 'pending', 
     now() - interval '2 days', now() - interval '2 days'),
    (gen_random_uuid(), v_tenant_id, v_app2_id, 'email', 
     date_trunc('day', now()) + interval '1 day' + interval '5 hours', 'pending', 
     now() - interval '2 days', now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  -- Completed task
  INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_app3_id, 'review', 
     now() - interval '1 day', 'completed', 
     now() - interval '3 days', now() - interval '1 day')
  ON CONFLICT DO NOTHING;

  -- Future tasks
  INSERT INTO tasks (id, tenant_id, application_id, type, due_at, status, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_app1_id, 'call', 
     now() + interval '3 days', 'pending', 
     now() - interval '1 day', now() - interval '1 day'),
    (gen_random_uuid(), v_tenant_id, v_app2_id, 'email', 
     now() + interval '5 days', 'pending', 
     now() - interval '2 days', now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed data created successfully!';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Admin User: %', v_admin_id;
  RAISE NOTICE 'Counselor User: %', v_counselor_id;
  RAISE NOTICE 'Created: 2 Teams, 2 Users, 4 Leads, 3 Applications, and 8 Tasks';
END $$;

