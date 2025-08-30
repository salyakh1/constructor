-- 🎉 Wedding Invitation Constructor - Supabase Schema
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- Создание таблицы приглашений
CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы пожеланий
CREATE TABLE IF NOT EXISTS wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_slug TEXT NOT NULL REFERENCES invites(slug) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы RSVP ответов
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_slug TEXT NOT NULL REFERENCES invites(slug) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
  guests_count INTEGER DEFAULT 1,
  dietary_restrictions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_invites_slug ON invites(slug);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON invites(created_at);
CREATE INDEX IF NOT EXISTS idx_invites_is_deleted ON invites(is_deleted);
CREATE INDEX IF NOT EXISTS idx_wishes_invite_slug ON wishes(invite_slug);
CREATE INDEX IF NOT EXISTS idx_rsvp_invite_slug ON rsvp(invite_slug);

-- Включение Row Level Security (RLS)
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для invites
CREATE POLICY "Public read access for active invites" ON invites
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authorized create access" ON invites
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authorized update access" ON invites
  FOR UPDATE USING (true);

CREATE POLICY "Authorized delete access" ON invites
  FOR DELETE USING (true);

-- Политики безопасности для wishes
CREATE POLICY "Public read access for wishes" ON wishes
  FOR SELECT USING (true);

CREATE POLICY "Public create access for wishes" ON wishes
  FOR INSERT WITH CHECK (true);

-- Политики безопасности для rsvp
CREATE POLICY "Public read access for rsvp" ON rsvp
  FOR SELECT USING (true);

CREATE POLICY "Public create access for rsvp" ON rsvp
  FOR INSERT WITH CHECK (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_invites_updated_at 
  BEFORE UPDATE ON invites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Функция для проверки уникальности slug
CREATE OR REPLACE FUNCTION check_slug_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM invites WHERE slug = NEW.slug AND id != NEW.id) THEN
    RAISE EXCEPTION 'Slug must be unique';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для проверки уникальности slug
CREATE TRIGGER check_invites_slug_uniqueness
  BEFORE INSERT OR UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION check_slug_uniqueness();

-- Создание представления для статистики
CREATE OR REPLACE VIEW invites_stats AS
SELECT 
  COUNT(*) as total_invites,
  COUNT(*) FILTER (WHERE NOT is_deleted) as active_invites,
  COUNT(*) FILTER (WHERE is_deleted) as deleted_invites,
  MAX(created_at) as latest_invite
FROM invites;

-- Создание представления для статистики пожеланий
CREATE OR REPLACE VIEW wishes_stats AS
SELECT 
  i.slug,
  i.content->>'title' as invite_title,
  COUNT(w.id) as wishes_count,
  MAX(w.created_at) as latest_wish
FROM invites i
LEFT JOIN wishes w ON i.slug = w.invite_slug
WHERE NOT i.is_deleted
GROUP BY i.slug, i.content;

-- Создание представления для статистики RSVP
CREATE OR REPLACE VIEW rsvp_stats AS
SELECT 
  i.slug,
  i.content->>'title' as invite_title,
  COUNT(r.id) as responses_count,
  COUNT(r.id) FILTER (WHERE r.response = 'yes') as yes_count,
  COUNT(r.id) FILTER (WHERE r.response = 'no') as no_count,
  COUNT(r.id) FILTER (WHERE r.response = 'maybe') as maybe_count,
  SUM(r.guests_count) FILTER (WHERE r.response = 'yes') as total_guests
FROM invites i
LEFT JOIN rsvp r ON i.slug = r.invite_slug
WHERE NOT i.is_deleted
GROUP BY i.slug, i.content;

-- Вставка тестовых данных (опционально)
-- INSERT INTO invites (slug, content) VALUES 
-- ('test-invite', '{"title": "Тестовое приглашение", "blocks": []}');

-- Проверка создания таблиц
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invites', 'wishes', 'rsvp')
ORDER BY table_name;

-- Проверка политик безопасности
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
