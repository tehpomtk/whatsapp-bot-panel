
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const db = require('../db');

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM deleted_messages ORDER BY id DESC LIMIT 500').all();
  res.render('deleted', { rows });
});
const fs = require('fs');
const path = require('path');

router.post('/delete/:id', (req, res) => {
  try {
    const id = req.params.id;
    const row = db.prepare('SELECT body FROM deleted_messages WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ ok: false, error: 'Сообщение не найдено' });

    // Проверяем, есть ли медиафайл
    if (row.body && row.body.startsWith('[MEDIA:')) {
      const match = row.body.match(/\[MEDIA:\s*(.*)\]/);
      const filePath = match ? match[1] : null;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // удаляем файл
        console.log('🗑️ Удалён файл:', filePath);
      }
    }

    // Удаляем запись из БД
    db.prepare('DELETE FROM deleted_messages WHERE id = ?').run(id);

    res.json({ ok: true, message: 'Сообщение и медиа удалены' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
