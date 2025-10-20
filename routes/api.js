
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const { getQrDataURL, getWALoggedIn, sendText } = require('../bot');

router.get('/qr', (req, res) => {
  const qr = getQrDataURL();
  if (!qr) return res.status(404).json({ error: 'QR not available yet' });
  res.json({ dataURL: qr });
});

router.get('/status', (req, res) => {
  res.json({ wa_ready: getWALoggedIn() });
});

router.post('/send', requireAuth, async (req, res) => {
  const { chat_id, message } = req.body;
  try {
    await sendText(chat_id, message);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// --- Новый API для GET-запроса ---
router.get('/sendget', async (req, res) => {
  const { tel, text } = req.query;
  if (!tel || !text) {
    return res.status(400).json({ ok: false, error: 'Нужно указать tel и text' });
  }

  const chatId = tel.replace(/[^0-9]/g, '') + '@c.us';
  try {
    await sendText(chatId, text);
    res.json({ ok: true, sent_to: chatId, message: text });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;

