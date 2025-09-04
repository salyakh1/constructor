# 🚀 Руководство по деплою на Vercel

## ✅ Готово к деплою!

Проект полностью настроен и готов к деплою на Vercel. Все исправления внесены:

### 🔧 Исправления для Vercel:
- ✅ Разделены серверные и клиентские компоненты
- ✅ Удалена проблемная настройка `output: 'standalone'`
- ✅ Исправлена ошибка `constructor.rsc`
- ✅ Проект успешно собирается (`npm run build`)

## 📋 Шаги для деплоя:

### 1. Подключение к Vercel
1. Зайдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите репозиторий `salyakh1/constructor`

### 2. Настройка переменных окружения
В настройках проекта добавьте:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 3. Настройки сборки
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (по умолчанию)
- **Install Command:** `npm install`

### 4. Деплой
1. Нажмите "Deploy"
2. Дождитесь завершения сборки
3. Получите ссылку на приложение

## 🎯 Результат:
- ✅ Конструктор: `https://your-app.vercel.app/constructor`
- ✅ Приглашения: `https://your-app.vercel.app/invite/[slug]`
- ✅ Админ-панель: `https://your-app.vercel.app/admin`

## 🔍 Проверка:
После деплоя проверьте:
1. Открывается ли конструктор без ошибок
2. Работают ли все блоки и анимации
3. Сохраняются ли приглашения
4. Генерируются ли QR-коды

## 🆘 Если что-то не работает:
1. Проверьте переменные окружения
2. Убедитесь, что Supabase настроен
3. Проверьте логи в Vercel Dashboard
4. Убедитесь, что все зависимости установлены

---
**Проект готов к продакшену! 🎉**
