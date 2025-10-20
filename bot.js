
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const path = require('path');
const db = require('./db');

// ------- Конфигурвция -------
const CALL_WHITELIST = []; // e.g. ['77074779338@c.us']
const EXECUTABLE_PATH = require('puppeteer').executablePath();

// куар код в веб панели
let latestQRDataURL = null;
let waReady = false;

const client = new Client({
  puppeteer: {
    executablePath: EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  authStrategy: new LocalAuth({
    clientId: 'bot01',
    dataPath: path.join(__dirname, 'sessions')
  })
});

client.on('qr', async (qr) => {
  console.log('Сканируй QR-код (также доступен на /api/qr):');
  qrcodeTerminal.generate(qr, { small: true });
  try {
    latestQRDataURL = await qrcode.toDataURL(qr);
  } catch (e) { latestQRDataURL = null; }
});

client.on('ready', () => {
  waReady = true;
  console.log(' ВАтсап клиент готов.');
});

client.on('authenticated', () => console.log('WA авторизованно.'));
client.on('auth_failure', (m)=>console.error('WA ошибка авторизации:', m));
client.on('disconnected', ()=>{ waReady=false; console.log('WA отключено'); });

// -------------- Удаленые сообщения --------------
client.on('message_revoke_everyone', async (after, before) => {
  // 'after' is the after-revocation message; 'before' is the original message
  const msg = before || after;
  try {
    const chatId = msg.from;
    const author = msg.author || msg.from;
    db.prepare(`INSERT INTO deleted_messages (chat_id, author_id, message_id, message_type, body, timestamp_ms)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(chatId, author, msg.id._serialized, msg.type, msg.body || null, msg.timestamp ? msg.timestamp*1000 : null);
    console.log(`записано удаленное сообщение от  ${author} или ${chatId}`);
  } catch (e) { console.error('ошибка добавления в лог удаленного сообщения:', e); }
});

// -------------- шукнция отлова звонков --------------
client.on('call', async (call) => {
  try {
    if (!CALL_WHITELIST.includes(call.from)) {
      await call.reject();
      await client.sendMessage(call.from,
        'Пользователь ограничил аудио/видео звонки. Уведомление о звонке не будет отображено.');
      console.log(`звонок откланен от ${call.from}`);
    } else {
      console.log(`CЗвонок принят от ${call.from}`);
    }
  } catch (e) { console.error('Call handling error', e); }
});

// -------------- автоответы --------------
async function processAutoReplies(message) {
  // пропуск груп
  const chat = await message.getChat();
  const isGroup = chat.isGroup;

  // опция видео сообщений из груп
  const mediaMap = { 'ptt': true, 'video_note': true };
  if (mediaMap[message.type] && isGroup) {
    // ignore media in groups
    return;
  }

  // Загрузка правил из базы данных
  const rules = db.prepare('SELECT * FROM auto_replies WHERE active=1').all();
  const body = (message.body || '').toString();

  for (const r of rules) {
    // scope check
    if (r.scope && r.scope !== 'all') {
      if (r.scope !== message.from) continue;
    }
    let hit = false;
    if (r.is_regex) {
      try {
        const re = new RegExp(r.pattern, 'i');
        hit = re.test(body);
      } catch (e) { hit = false; }
    } else {
      hit = body.toLowerCase().includes(r.pattern.toLowerCase());
    }
    if (hit) {
      await message.reply(r.reply);
      break; // first match wins
    }
  }
}

// -------------- сообщения  пример --------------
client.on('message', async (message) => {
  try {
    // Example simple command from original code:
    if (message.type === 'chat' && message.body && message.body.toLowerCase().trim() === 'ты кто?') {
      await message.reply('Я бот и хрен ты сомной договоришся!');
      return;
    }
    await processAutoReplies(message);
  } catch (e) {
    console.error('ошибка разбора сообщения', e);
  }
});

// -------------- Scheduler --------------
const cron = require('node-cron');

function startSchedulers() {
  // CRON jobs
  const cronRows = db.prepare('SELECT * FROM scheduled WHERE enabled=1 AND cron IS NOT NULL').all();
  cronRows.forEach(row => {
    cron.schedule(row.cron, async () => {
      try {
        await client.sendMessage(row.chat_id, row.message);
        db.prepare('UPDATE scheduled SET last_run_at=CURRENT_TIMESTAMP WHERE id=?').run(row.id);
        console.log(`CRON sent to ${row.chat_id}`);
      } catch (e) { console.error('CRON send error', e); }
    });
  });

  // One-shot jobs (poll every 30s)
  setInterval(() => {
    const due = db.prepare(`SELECT * FROM scheduled
      WHERE enabled=1 AND run_at IS NOT NULL AND datetime(run_at) <= datetime('now')`).all();
    for (const row of due) {
      try {
        client.sendMessage(row.chat_id, row.message);
        db.prepare('UPDATE scheduled SET enabled=0, last_run_at=CURRENT_TIMESTAMP WHERE id=?').run(row.id);
        console.log(`One-shot sent to ${row.chat_id}`);
      } catch (e) { console.error('ошибка отправки', e); }
    }
  }, 30000);
}

client.initialize();
startSchedulers();

// Helpers for web
function getQrDataURL() { return latestQRDataURL; }
function getWALoggedIn() { return waReady; }
async function sendText(chatId, text) { return client.sendMessage(chatId, text); }

module.exports = { client, getQrDataURL, getWALoggedIn, sendText };
