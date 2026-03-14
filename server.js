const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;
const PUBLIC  = path.join(__dirname, 'public');

// ── متغيرات البيئة للنطاقات القابلة للتخصيص ──
const QURAN_APIS = process.env.QURAN_APIS ||
  'https://api.alquran.cloud https://api.qurancdn.com https://quran-api.pages.dev https://al-quran.info';

const AUDIO_SOURCES = process.env.AUDIO_SOURCES ||
  'https://everyayah.com https://cdn.islamic.network https://verses.quran.com';

const SCRIPT_CDNS = process.env.SCRIPT_CDNS ||
  'https://cdn.jsdelivr.net https://unpkg.com';

// ── بناء CSP ──
// ملاحظة: unsafe-inline ضروري لأن الـ HTML يحتوي على
// 116 inline event handler و 240 inline style — لا يمكن إزالته
// بدون إعادة بناء الـ frontend بالكامل
function buildCSP() {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${SCRIPT_CDNS} blob:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src 'self' ${QURAN_APIS} ${SCRIPT_CDNS} blob:`,
    `media-src 'self' blob: ${AUDIO_SOURCES}`,
    "img-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "child-src blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

// ── Security Headers ──
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', buildCSP());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── التحقق من وجود مجلد public عند البدء ──
const fs = require('fs');
if (!fs.existsSync(PUBLIC)) {
  console.error(`❌ مجلد public غير موجود في: ${PUBLIC}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(PUBLIC, 'index.html'))) {
  console.error(`❌ index.html غير موجود في: ${PUBLIC}`);
  process.exit(1);
}

// ── Static Files ──
app.use(express.static(PUBLIC, {
  maxAge: '1d',
  etag: true,
  index: 'index.html'
}));

// ── SPA Fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC, 'index.html'));
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Islam Reels running → http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${PUBLIC}`);
  console.log(`🔒 CSP active — unsafe-inline required (116 inline handlers in frontend)`);
});
