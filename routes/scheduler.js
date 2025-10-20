
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const db = require('../db');

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM scheduled ORDER BY id DESC').all();
  res.render('scheduler', { rows });
});

router.post('/add', requireAuth, (req, res) => {
  const { chat_id, message, cron, run_at } = req.body;
  db.prepare('INSERT INTO scheduled (chat_id, message, cron, run_at, enabled) VALUES (?, ?, ?, ?, 1)')
    .run(chat_id, message, cron || null, run_at || null);
  res.redirect('/scheduler');
});

router.post('/toggle/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM scheduled WHERE id=?').get(id);
  if (!row) return res.redirect('/scheduler');
  const newVal = row.enabled ? 0 : 1;
  db.prepare('UPDATE scheduled SET enabled=? WHERE id=?').run(newVal, id);
  res.redirect('/scheduler');
});

router.post('/delete/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM scheduled WHERE id=?').run(req.params.id);
  res.redirect('/scheduler');
});

module.exports = router;
