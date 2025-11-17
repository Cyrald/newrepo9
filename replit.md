# Natural Products E-Commerce Platform

## Overview

This is a full-featured e-commerce platform for natural and organic products, built as a React SPA with a Node.js/Express backend. It provides an online shopping experience for customers and comprehensive admin tools for product, order, and customer management. The platform supports a role-based access control system (administrators, marketers, consultants, customers) and integrates with third-party services for payments, delivery, and email verification.

## Recent Changes

**November 17, 2025** - UI/UX улучшения и рефакторинг бизнес-логики:
- ✅ Header: сотрудники (admin/marketer/consultant) видят кнопку "Админ панель" вместо "Поддержка"
- ✅ Виджет чата: модальное окно consent по центру экрана, затем чат в правом нижнем углу как messenger
- ✅ Виджет чата: поддержка неаутентифицированных пользователей (показ формы входа при попытке начать чат)
- ✅ Overlay модального окна больше не закрывает consent (предотвращение случайного закрытия)
- ✅ Админ панель чата: восстановлена боковая панель AdminLayout с навигацией
- ✅ Промокоды: удалено поле maxOrderAmount, добавлено maxDiscountAmount
- ✅ Промокоды: скидка применяется только к товарам (subtotal), не к стоимости доставки
- ✅ Карточки товаров: название ограничено 2 строками (line-clamp-2)
- ✅ Badge корзины: абсолютное позиционирование, показ "99+" при количестве >99
- ✅ Админ панель: "Dashboard" переименован в "Главная"
- ✅ Таблица пользователей: показывается "Номер телефона" вместо "Статус"

**November 17, 2025** - Реализация чата поддержки:
- ✅ Добавлена кнопка "Поддержка"/"Админ панель" в header с логикой по ролям
- ✅ Создана страница политики конфиденциальности (/privacy-policy)
- ✅ Реализован виджет чата для пользователей (SupportChatWidget) с privacy consent
- ✅ Создана админ страница чата поддержки (/admin/support)
- ✅ WebSocket клиент для real-time уведомлений
- ✅ REST API endpoints: GET/POST /api/support/messages, GET /api/support/conversations, GET /api/support/customer-info
- ✅ Проверка ролей в API: только admin/consultant могут читать чужие сообщения
- ✅ Targeted broadcast: уведомления отправляются только участникам диалога
- ⚠️ **KNOWN SECURITY ISSUE**: WebSocket authentication не валидирует session cookie - требуется исправление перед production
- 🔧 TODO: Добавить валидацию сессии при WebSocket handshake (парсинг cookie, проверка req.session)

**November 17, 2025** - Исправление аутентификации и безопасности:
- ✅ Исправлен flow авторизации: после login вызывается checkAuth() для загрузки ролей
- ✅ ProtectedRoute показывает loading вместо блокировки если роли ещё не загружены
- ✅ Убрана утечка информации: список ролей больше не показывается в тексте ошибок
- ✅ JWT_SECRET переименован в SESSION_SECRET (правильное название для сессий)
- ✅ Безопасная генерация SESSION_SECRET: авто-генерация только в dev, production требует явный ключ
- 🔐 Архитектура безопасности: все проверки прав выполняются на backend, frontend только для UX

**November 16, 2025** - Фаза 1: Усиление безопасности и подключение frontend:
- ✅ JWT_SECRET валидация через Zod (требует 32+ символов, убрано дефолтное значение)
- ✅ Rate limiting для auth endpoints (5 попыток/15 мин для login/register, 10/мин для promocodes)
- ✅ Security headers с helmet (строгая CSP в production, отключена в dev для Vite)
- ✅ Input sanitization для поисковых запросов и ID параметров
- ✅ WebSocket auth улучшена (токен в первом сообщении вместо URL)
- ✅ Error handling улучшен (generic messages для 5xx, stack traces только в dev)
- ✅ Environment validation с полной Zod схемой
- ✅ Admin статистика endpoint с реальными данными из БД
- ✅ Frontend полностью подключен к API через React Query хуки
- ✅ Vite HMR конфигурация обновлена для Replit окружения
- 📊 Статус безопасности MVP: существенно улучшен

**November 16, 2025** - Комплексный анализ и заполнение базы данных:
- ✅ Выполнен seed базы данных (4 пользователя, 5 категорий, 30 товаров)
- ✅ Проведен полный анализ безопасности (найдено 8 критических уязвимостей)
- ✅ Создан детальный отчет ОТЧЕТ_РАЗРАБОТКА.md с планом доработки
- ✅ Выявлены все недостающие модули (ЮKassa, СДЭК, Boxberry)
- ✅ Составлен приоритизированный план на 3 недели разработки
- ⚠️ Статус готовности MVP: 65%

**November 16, 2025** - Initial Replit Environment Setup:
- Installed all npm dependencies
- Configured PostgreSQL database and pushed schema using Drizzle
- Set up Vite development server on port 5000 with proper host configuration (0.0.0.0)
- Configured HMR for Replit proxy environment (wss protocol on port 443)
- Set up dev-server workflow for automatic restarts
- Configured deployment for autoscale with production build
- Application is fully functional and running

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 18 with TypeScript
- Wouter for client-side routing
- Single Page Application (SPA)

**UI & Styling:**
- Shadcn UI component library
- Tailwind CSS for utility-first styling
- Custom color palette: green (primary), beige, gold accents
- Mobile-first responsive design
- Typography: Open Sans (body), Playfair Display/Lora (serif headings)
- Light/dark mode support

**State Management:**
- Zustand for global application state
- TanStack Query (React Query v5) for server state management and caching
- React Hook Form with Zod validation for form handling

### Backend Architecture

**Server Framework:**
- Node.js with Express.js
- TypeScript for type safety
- RESTful API endpoints under `/api`

**Authentication & Authorization:**
- Session-based authentication with PostgreSQL session store (connect-pg-simple)
- bcrypt for password hashing
- Role-based access control (RBAC) with middleware
- Roles: Customer, Consultant, Marketer, Admin
- Backend enforces all authorization checks, frontend only for UX

**File Upload:**
- Multer middleware for `multipart/form-data`
- Stores product images and chat attachments in `/uploads`
- Supports JPEG, PNG, WEBP formats

**Real-time Communication:**
- WebSocket server (`ws` library) for live support chat notifications
- WebSocket only for real-time notifications, messages created via REST API
- Connected users tracked in Map (userId -> WebSocket connection)
- Targeted broadcast to conversation participants only
- **Security Warning**: WebSocket auth currently accepts userId without session validation - requires hardening before production

### Data Storage Solutions

**Database:**
- PostgreSQL as the primary database
- Neon serverless PostgreSQL for cloud deployment
- Drizzle ORM for type-safe queries and migrations

**Schema Design:**
- Comprehensive schema including Users, Roles, Products, Categories, Orders, Cart, Wishlist, Comparison, Support Messages, Payment Cards, Addresses.
- UUID primary keys, timestamps, soft delete patterns, and indexing.

### Business Logic

**Bonus System:**
- New users receive 100 bonus points.
- Cashback rates based on order value (3% to 10%).
- Bonuses cannot be earned with promocodes/existing bonuses.
- Maximum 20% of order payable with bonuses.

**Promocode System:**
- Percentage-based discounts with min/max order restrictions.
- Expiration dates, usage limits, active/inactive status.
- Uppercase code normalization.

**Order Processing:**
- Multi-step checkout: address → delivery → payment → confirmation.
- Integration with delivery services for cost calculation.
- Support for multiple payment methods and order status tracking.

**Support Chat System:**
- Customer widget with privacy consent (stored in localStorage)
- Admin interface showing active conversations with customer info
- Real-time message delivery via WebSocket notifications
- REST API for message persistence with role-based access control
- Auto-select first conversation in admin interface
- Privacy policy page with full consent flow

## External Dependencies

- **Payment Integration:** YooKassa SDK
- **Delivery Services:** CDEK API, Boxberry API
- **Email Service:** Nodemailer (for transactional emails)
- **Database Service:** Neon serverless PostgreSQL
- **Development Tools:** Vite, Drizzle Kit, ESBuild