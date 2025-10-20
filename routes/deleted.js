
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const db = require('../db');

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM deleted_messages ORDER BY id DESC LIMIT 500').all();
  res.render('deleted', { rows });
});

module.exports = router;
