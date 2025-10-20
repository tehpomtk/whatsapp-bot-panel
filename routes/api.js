
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

module.exports = router;
