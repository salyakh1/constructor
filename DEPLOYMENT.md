# 🚀 Инструкции по деплою на Vercel

## 📋 Предварительные требования

1. **GitHub аккаунт** с репозиторием проекта
2. **Vercel аккаунт** (можно создать через GitHub)
3. **Supabase проект** с настроенными таблицами

## 🔧 Шаг 1: Подготовка GitHub

1. **Создайте новый репозиторий** на GitHub
2. **Инициализируйте Git** в локальной папке:
```bash
cd constructor
git init
git add .
git commit -m "Initial commit: Wedding Invitation Constructor"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 🚀 Шаг 2: Деплой на Vercel

1. **Зайдите на [vercel.com](https://vercel.com)**
2. **Нажмите "New Project"**
3. **Подключите GitHub репозиторий**
4. **Выберите репозиторий** с проектом
5. **Нажмите "Deploy"**

## ⚙️ Шаг 3: Настройка переменных окружения

В настройках проекта Vercel добавьте:

### **Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
ADMIN_PASSWORD=your-secure-password
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

### **Как получить Supabase данные:**
1. Зайдите в [supabase.com](https://supabase.com)
2. Откройте ваш проект
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🗄️ Шаг 4: Настройка Supabase

1. **Создайте таблицу** в SQL Editor:
```sql
-- Создание таблицы приглашений
CREATE TABLE invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_invites_slug ON invites(slug);
CREATE INDEX idx_invites_created_at ON invites(created_at);
CREATE INDEX idx_invites_is_deleted ON invites(is_deleted);
```

2. **Настройте RLS (Row Level Security):**
```sql
-- Включаем RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (публичный доступ)
CREATE POLICY "Public read access" ON invites
  FOR SELECT USING (NOT is_deleted);

-- Политика для создания (только авторизованные)
CREATE POLICY "Authorized create access" ON invites
  FOR INSERT WITH CHECK (true);

-- Политика для обновления (только авторизованные)
CREATE POLICY "Authorized update access" ON invites
  FOR UPDATE USING (true);
```

## 🔒 Шаг 5: Безопасность

1. **Измените пароль по умолчанию:**
   - В Vercel переменных окружения замените `wedding2024` на сложный пароль
   - Используйте генератор паролей (минимум 12 символов)

2. **Настройте CORS в Supabase:**
   - Перейдите в **Settings** → **API**
   - В **CORS Origins** добавьте ваш Vercel домен
   - Например: `https://your-project.vercel.app`

## 🌐 Шаг 6: Тестирование

1. **Откройте ваш Vercel домен**
2. **Попробуйте зайти в конструктор** (`/constructor`)
3. **Введите пароль** из переменных окружения
4. **Создайте тестовое приглашение**
5. **Проверьте публичный доступ** по ссылке

## 📱 Шаг 7: Использование

### **Для вас (защищенный доступ):**
- **Конструктор**: `https://your-project.vercel.app/constructor`
- **Админка**: `https://your-project.vercel.app/admin`
- **Пароль**: из переменной `ADMIN_PASSWORD`

### **Для гостей (публичный доступ):**
- **Приглашения**: `https://your-project.vercel.app/invite/[slug]`
- **Пример**: `https://your-project.vercel.app/invite/abc123def4`

## 🔄 Обновления

При каждом push в GitHub:
1. Vercel автоматически собирает проект
2. Деплоит новую версию
3. Обновляет ваш сайт

## 🆘 Решение проблем

### **Ошибка "Module not found":**
- Проверьте, что все зависимости в `package.json`
- Убедитесь, что `npm install` выполнен

### **Ошибка Supabase:**
- Проверьте переменные окружения в Vercel
- Убедитесь, что таблицы созданы в Supabase

### **Ошибка аутентификации:**
- Проверьте переменную `ADMIN_PASSWORD`
- Убедитесь, что middleware работает

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в Vercel Dashboard
2. Проверьте логи в Supabase Dashboard
3. Создайте Issue в GitHub репозитории

---

**Успешного деплоя! 🎉**
