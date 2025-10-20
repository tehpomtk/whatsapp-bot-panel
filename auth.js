
const db = require('./db');
const bcrypt = require('bcrypt');

function ensureAdminSeed() {
  // Create admin/123456 if not exists (you MUST change password after first login)
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!row) {
    const passhash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO users (username, passhash) VALUES (?, ?)').run('admin', passhash);
    console.log('авторизуйся: admin / 123456');
  }
}

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
}

module.exports = { ensureAdminSeed, requireAuth };
