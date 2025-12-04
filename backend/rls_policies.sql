-- Row-Level Security Policies for Leads

-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Select leads policy" ON leads;
DROP POLICY IF EXISTS "Insert leads policy" ON leads;

-- SELECT Policy: Combined policy for counselors and admins
-- Admins can see all leads in their tenant
-- Counselors can see leads they own OR leads where the owner belongs to a team they're on
CREATE POLICY "Select leads policy"
ON leads
FOR SELECT
USING (
    -- Admins can see all leads in their tenant
    (auth.jwt() ->> 'role' = 'admin' AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    OR
    -- Counselors can see leads they own
    (auth.jwt() ->> 'role' = 'counselor' 
     AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
     AND owner_id = (auth.jwt() ->> 'user_id')::uuid)
    OR
    -- Counselors can see leads assigned to teams they belong to
    -- (leads where the owner is in the same team as the counselor)
    (auth.jwt() ->> 'role' = 'counselor'
     AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
     AND EXISTS (
         SELECT 1
         FROM user_teams ut_counselor
         JOIN user_teams ut_owner ON ut_counselor.team_id = ut_owner.team_id
         WHERE ut_counselor.user_id = (auth.jwt() ->> 'user_id')::uuid
         AND ut_owner.user_id = leads.owner_id
     ))
);

-- INSERT Policy: Counselors and admins can add leads under their tenant
CREATE POLICY "Insert leads policy"
ON leads
FOR INSERT
WITH CHECK (
    (auth.jwt() ->> 'role' IN ('counselor', 'admin'))
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

