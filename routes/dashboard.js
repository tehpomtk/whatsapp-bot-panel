
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const { getWALoggedIn } = require('../bot');
const db = require('../db');

router.get('/', requireAuth, (req, res) => {
  const stats = {
    wa_ready: getWALoggedIn(),
    auto_replies: db.prepare('SELECT COUNT(*) c FROM auto_replies').get().c,
    scheduled: db.prepare('SELECT COUNT(*) c FROM scheduled').get().c,
    deleted: db.prepare('SELECT COUNT(*) c FROM deleted_messages').get().c
  };
  res.render('dashboard', { user: req.session.username, stats });
});

module.exports = router;
