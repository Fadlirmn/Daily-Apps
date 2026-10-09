-- MIGRASI HISTORIS — sudah pernah dijalankan di DB produksi/dev lama.
-- JANGAN jalankan ulang tanpa mengganti UUID di bawah ke user_id yang valid
-- di environment tujuan. UUID ini adalah akun nyata, bukan placeholder.
-- Untuk setup baru dari nol, skema sudah lengkap di db/schema.sql — file ini
-- tidak diperlukan lagi.
--
-- Add user_id to budgets, goals, tasks, habits, schedules
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Backfill existing rows to sumbul user
UPDATE budgets SET user_id = '6a7f5a74-8932-4f2d-8404-d06a7c451546' WHERE user_id IS NULL;
UPDATE goals SET user_id = '6a7f5a74-8932-4f2d-8404-d06a7c451546' WHERE user_id IS NULL;
UPDATE tasks SET user_id = '6a7f5a74-8932-4f2d-8404-d06a7c451546' WHERE user_id IS NULL;
UPDATE habits SET user_id = '6a7f5a74-8932-4f2d-8404-d06a7c451546' WHERE user_id IS NULL;
UPDATE schedules SET user_id = '6a7f5a74-8932-4f2d-8404-d06a7c451546' WHERE user_id IS NULL;

-- Make NOT NULL
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE habits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE schedules ALTER COLUMN user_id SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
