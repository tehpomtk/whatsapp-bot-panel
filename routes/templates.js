
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const db = require('../db');

router.get('/', requireAuth, (req, res) => {
  const rules = db.prepare('SELECT * FROM auto_replies ORDER BY id DESC').all();
  res.render('templates', { rules });
});

router.post('/add', requireAuth, (req, res) => {
  const { pattern, is_regex, reply, scope } = req.body;
  db.prepare('INSERT INTO auto_replies (pattern, is_regex, reply, scope, active) VALUES (?, ?, ?, ?, 1)')
    .run(pattern, is_regex ? 1 : 0, reply, scope || 'all');
  res.redirect('/templates');
});

router.post('/toggle/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM auto_replies WHERE id=?').get(id);
  if (!row) return res.redirect('/templates');
  const newVal = row.active ? 0 : 1;
  db.prepare('UPDATE auto_replies SET active=? WHERE id=?').run(newVal, id);
  res.redirect('/templates');
});

router.post('/delete/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM auto_replies WHERE id=?').run(req.params.id);
  res.redirect('/templates');
});

module.exports = router;
