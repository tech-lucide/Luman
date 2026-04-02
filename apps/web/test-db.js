const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gforvlhxweintgjjyukq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb3J2bGh4d2VpbnRnamp5dWtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY0MjY4MiwiZXhwIjoyMDgyMjE4NjgyfQ.02l5eIoDFvO940LoBY0aIoNi2hAg1y074TBPj9Z7Md4'
);

async function check() {
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').limit(1);
  if (!orgs || orgs.length === 0) return console.log('no orgs');
  
  const orgId = orgs[0].id;
  
  const { data: user, error: userErr } = await supabase.from('organizations').select('created_by').limit(1);
  const userId = user[0].created_by;

  const { data: folder, error: folderErr } = await supabase.from('workspace_folders').insert({
    name: 'Test Folder', color: 'red', organization_id: orgId, created_by: userId
  }).select().single();
  
  if (folderErr) return console.log('Folder err', folderErr);
  console.log('Folder created', folder.id);

  const { data: ws1, error: e1 } = await supabase.from('workspaces').insert({
    owner_name: 'ws1', role: 'founder', organization_id: orgId, created_by: userId, owner_id: userId, folder_id: folder.id
  }).select().single();
  
  console.log('WS1 err', e1, ws1);

  const { data: ws2, error: e2 } = await supabase.from('workspaces').insert({
    owner_name: 'ws2', role: 'founder', organization_id: orgId, created_by: userId, owner_id: userId, folder_id: folder.id
  }).select().single();
  
  console.log('WS2 err', e2, ws2);
}

check();
