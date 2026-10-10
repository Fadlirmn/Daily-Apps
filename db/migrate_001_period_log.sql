-- Arunika — migrasi 001: kolom period (fixed_expenses) + log (habits).
-- Untuk database LAMA yang dibuat sebelum kolom ini ada di db/schema.sql.
-- Aman dijalankan ulang (IF NOT EXISTS). Setup baru dari nol tidak perlu file ini.
--   docker exec -i daily-postgres psql -U fintrack -d fintrack < db/migrate_001_period_log.sql

ALTER TABLE fixed_expenses
  ADD COLUMN IF NOT EXISTS period TEXT NOT NULL DEFAULT 'bulanan' CHECK (period IN ('harian', 'bulanan'));

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS log JSONB NOT NULL DEFAULT '{}';
