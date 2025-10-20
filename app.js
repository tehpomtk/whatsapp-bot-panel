/**
 * Main entry — Express web panel (port 5050) + WhatsApp bot
 */
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts'); // ✅ добавлено
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./db');
const { ensureAdminSeed } = require('./auth');
const { client, getQrDataURL, getWALoggedIn, sendText } = require('./bot');

const app = express();

// ---------- Настройка шаблонов ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);              // ✅ активируем шаблонизатор с layout
app.set('layout', 'layout');          // ✅ файл макета layout.ejs
app.use('/public', express.static(path.join(__dirname, 'public')));

// ---------- Парсеры ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- Сессии ----------
app.use(session({
  store: new SQLiteStore({ db: 'sessions_web.sqlite', dir: __dirname }),
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 часов
}));

// ---------- Создание начального пользователя ----------
ensureAdminSeed();

// ---------- Маршруты ----------
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const schedulerRoutes = require('./routes/scheduler');
const templatesRoutes = require('./routes/templates');
const deletedRoutes = require('./routes/deleted');
const apiRoutes = require('./routes/api');

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/scheduler', schedulerRoutes);
app.use('/templates', templatesRoutes);
app.use('/deleted', deletedRoutes);
app.use('/api', apiRoutes);

// ---------- Перенаправление по умолчанию ----------
app.get('/', (req, res) => res.redirect('/dashboard'));

// ---------- Проверка состояния ----------
app.get('/healthz', (req, res) => {
  res.json({ ok: true, wa_ready: getWALoggedIn() });
});

// ---------- Запуск сервера ----------
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Web panel running on http://localhost:${PORT}`);
});
