-- Add missing fields for EIR and Loading Programme documents
-- This migration adds only new nullable columns, no existing columns are dropped or modified

-- On containers table:
-- - tare_weight numeric
-- - heavy boolean default false
-- - bl_no text

ALTER TABLE containers
ADD COLUMN IF NOT EXISTS tare_weight numeric,
ADD COLUMN IF NOT EXISTS heavy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bl_no text;

-- On gate_entries table:
-- - clearing_agent_id uuid references companies(id)
-- - arrival_date date
-- - chalan_no text

ALTER TABLE gate_entries
ADD COLUMN IF NOT EXISTS clearing_agent_id uuid REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS arrival_date date,
ADD COLUMN IF NOT EXISTS chalan_no text;

-- On bookings table:
-- - commodity text
-- - pod text
-- - cutoff_date timestamptz
-- - eta date

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS commodity text,
ADD COLUMN IF NOT EXISTS pod text,
ADD COLUMN IF NOT EXISTS cutoff_date timestamptz,
ADD COLUMN IF NOT EXISTS eta date;