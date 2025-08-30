# 📚 Настройка GitHub репозитория

## 🔧 Шаг 1: Создание репозитория

1. **Зайдите на [github.com](https://github.com)**
2. **Нажмите "New repository"**
3. **Заполните поля:**
   - **Repository name**: `wedding-invitation-constructor`
   - **Description**: `Современный конструктор свадебных приглашений`
   - **Visibility**: Private (рекомендуется) или Public
   - **Initialize with**: НЕ ставьте галочки
4. **Нажмите "Create repository"**

## 🚀 Шаг 2: Инициализация локального репозитория

Откройте терминал в папке проекта:

```bash
# Перейдите в папку проекта
cd constructor

# Инициализируйте Git
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: Wedding Invitation Constructor

- Конструктор блоков с 13 типами
- Система анимаций и анимаций
- Защищенный доступ к конструктору
- Интеграция с Supabase
- Готовность к деплою на Vercel"

# Переименуйте основную ветку в main
git branch -M main

# Добавьте удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/wedding-invitation-constructor.git

# Отправьте код в GitHub
git push -u origin main
```

## 📁 Структура файлов для GitHub

```
wedding-invitation-constructor/
├── src/                          # Исходный код
│   ├── app/                      # Next.js App Router
│   ├── components/               # React компоненты
│   ├── lib/                      # Утилиты
│   └── types/                    # TypeScript типы
├── public/                       # Статические файлы
├── .gitignore                    # Исключения Git
├── package.json                  # Зависимости
├── README.md                     # Описание проекта
├── DEPLOYMENT.md                 # Инструкции по деплою
├── GITHUB_SETUP.md              # Эта инструкция
├── vercel.json                   # Конфигурация Vercel
└── supabase-schema.sql          # Схема базы данных
```

## 🔒 Шаг 3: Настройка .gitignore

Убедитесь, что `.gitignore` содержит:

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env files
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## 📝 Шаг 4: Создание веток для разработки

```bash
# Создайте ветку для новой функции
git checkout -b feature/new-block-type

# Внесите изменения
# ... редактируйте файлы ...

# Добавьте изменения
git add .

# Создайте коммит
git commit -m "feat: add new block type for better UX"

# Отправьте ветку в GitHub
git push origin feature/new-block-type

# Вернитесь на основную ветку
git checkout main

# Обновите основную ветку
git pull origin main
```

## 🔄 Шаг 5: Рабочий процесс

### **Ежедневная работа:**
```bash
# Начало дня - обновите основную ветку
git checkout main
git pull origin main

# Создайте ветку для работы
git checkout -b feature/daily-updates

# Работайте над изменениями
# ... редактируйте файлы ...

# Сохраните изменения
git add .
git commit -m "feat: improve user interface and add new features"

# Отправьте изменения
git push origin feature/daily-updates
```

### **Слияние изменений:**
```bash
# Переключитесь на основную ветку
git checkout main

# Обновите её
git pull origin main

# Слейте вашу ветку
git merge feature/daily-updates

# Отправьте обновления
git push origin main

# Удалите временную ветку
git branch -d feature/daily-updates
git push origin --delete feature/daily-updates
```

## 🚨 Шаг 6: Безопасность

### **Не коммитьте:**
- `.env.local` файлы
- API ключи
- Пароли
- Личные данные

### **Всегда коммитьте:**
- `.env.example` файлы
- Конфигурационные файлы
- Документацию
- Исходный код

## 📊 Шаг 7: GitHub Actions (опционально)

Создайте `.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build project
      run: npm run build
```

## 🎯 Шаг 8: Следующие шаги

После настройки GitHub:

1. **Подключите к Vercel** (см. `DEPLOYMENT.md`)
2. **Настройте Supabase** (см. `DEPLOYMENT.md`)
3. **Протестируйте деплой**
4. **Начните работу над проектом**

## 🆘 Решение проблем

### **Ошибка "remote origin already exists":**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/wedding-invitation-constructor.git
```

### **Ошибка "refusing to merge unrelated histories":**
```bash
git pull origin main --allow-unrelated-histories
```

### **Ошибка "failed to push some refs":**
```bash
git pull origin main
git push origin main
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте [GitHub Help](https://help.github.com/)
2. Создайте Issue в репозитории
3. Обратитесь к документации Git

---

**Успешной настройки GitHub! 🚀**
