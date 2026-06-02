const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gforvlhxweintgjjyukq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb3J2bGh4d2VpbnRnamp5dWtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY0MjY4MiwiZXhwIjoyMDgyMjE4NjgyfQ.02l5eIoDFvO940LoBY0aIoNi2hAg1y074TBPj9Z7Md4'
);

async function inspect() {
  console.log("=== INSPECTING WORKSPACES ===");
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('id, owner_name, role, organization_id, owner_id');
  if (wsError) {
    console.error("Error fetching workspaces:", wsError);
  } else {
    console.log("Workspaces count:", workspaces.length);
    console.log(JSON.stringify(workspaces, null, 2));
  }

  console.log("\n=== INSPECTING ORGANIZATION MEMBERS ===");
  const { data: members, error: memError } = await supabase.from('organization_members').select('id, organization_id, user_id, role');
  if (memError) {
    console.error("Error fetching members:", memError);
  } else {
    console.log("Members count:", members.length);
    console.log(JSON.stringify(members, null, 2));
  }
}

inspect();
