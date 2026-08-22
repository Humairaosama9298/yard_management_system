const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jhwrgfkkrkxkmmqderiv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impod3JnZmtrcmt4a21tcWRlcml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDI4NzAsImV4cCI6MjEwMjgxODg3MH0.52Z0ciaOsUHI9EOZeaEGkxD4AYUEOg9kuAxQ89rrL_k';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  const sql = `
    ALTER TABLE containers
    ADD COLUMN IF NOT EXISTS tare_weight numeric,
    ADD COLUMN IF NOT EXISTS heavy boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS bl_no text;

    ALTER TABLE gate_entries
    ADD COLUMN IF NOT EXISTS clearing_agent_id uuid REFERENCES companies(id),
    ADD COLUMN IF NOT EXISTS arrival_date date,
    ADD COLUMN IF NOT EXISTS chalan_no text;

    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS commodity text,
    ADD COLUMN IF NOT EXISTS pod text,
    ADD COLUMN IF NOT EXISTS cutoff_date timestamptz,
    ADD COLUMN IF NOT EXISTS eta date;
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  console.log('Result:', data, error?.message);
}
runMigration();