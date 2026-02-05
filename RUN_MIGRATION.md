# Run Database Migration for Events Table

You need to run the SQL migration to create the events table in your Supabase database.

## Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create events table for calendar system
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  event_type TEXT DEFAULT 'event', -- 'event', 'reminder', 'task'
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add event_id to tasks table to link tasks to calendar events
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_workspace ON events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_event ON tasks(event_id);
```

5. Click **Run** or press `Ctrl+Enter`
6. Verify the tables were created successfully

## Option 2: Supabase CLI (If installed)

```bash
npx supabase db push
```

## Verify Migration

After running the migration, you can verify by:
1. Going to **Table Editor** in Supabase dashboard
2. You should see a new `events` table
3. The `tasks` table should have a new `event_id` column

Once done, the calendar system will be fully functional!
