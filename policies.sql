ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all leads"
ON leads
FOR SELECT
USING (
  (auth.jwt() ->> 'role') = 'admin'
);


CREATE POLICY "Counselors view assigned or team leads"
ON leads
FOR SELECT
USING (
 
  leads.owner_id = auth.uid() 
  OR
 
  EXISTS (
    SELECT 1 
    FROM user_teams my_team
    JOIN user_teams lead_owner_team ON my_team.team_id = lead_owner_team.team_id
    WHERE my_team.user_id = auth.uid()
    AND lead_owner_team.user_id = leads.owner_id 
  )
);


CREATE POLICY "Enable insert for authenticated users"
ON leads
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role') IN ('admin', 'counselor')
);