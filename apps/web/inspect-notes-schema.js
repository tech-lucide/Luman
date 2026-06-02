const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gforvlhxweintgjjyukq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb3J2bGh4d2VpbnRnamp5dWtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY0MjY4MiwiZXhwIjoyMDgyMjE4NjgyfQ.02l5eIoDFvO940LoBY0aIoNi2hAg1y074TBPj9Z7Md4'
);

async function inspectNotes() {
  console.log("=== INSPECTING NOTES TABLE FOREIGN KEYS ===");
  const { data, error } = await supabase.rpc('inspect_table_constraints', { table_name: 'notes' });
  
  if (error) {
    // If RPC doesn't exist, we can query using a direct sql query or select some info.
    // Let's try executing a custom query or getting table info if possible.
    console.log("RPC failed, trying manual query...");
    
    // We can fetch one note to see its structure
    const { data: notes, error: notesError } = await supabase.from('notes').select('*').limit(1);
    if (notesError) {
      console.error("Error fetching notes:", notesError);
    } else {
      console.log("Sample Note:", JSON.stringify(notes, null, 2));
    }
  } else {
    console.log(data);
  }
}

inspectNotes();
