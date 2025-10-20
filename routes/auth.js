
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!row) return res.render('login', { error: 'Неверный логин или пароль' });
  const ok = bcrypt.compareSync(password, row.passhash);
  if (!ok) return res.render('login', { error: 'Неверный логин или пароль' });
  req.session.userId = row.id;
  req.session.username = row.username;
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(()=> res.redirect('/login'));
});

module.exports = router;
