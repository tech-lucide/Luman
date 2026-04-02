async function test() {
  const supabaseUrl = 'https://gforvlhxweintgjjyukq.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb3J2bGh4d2VpbnRnamp5dWtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY0MjY4MiwiZXhwIjoyMDgyMjE4NjgyfQ.02l5eIoDFvO940LoBY0aIoNi2hAg1y074TBPj9Z7Md4';

  const res = await fetch(`${supabaseUrl}/rest/v1/workspaces?select=*`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
