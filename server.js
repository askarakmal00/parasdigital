require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/parasdigital'
});

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'parasdigital2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'paras_secret_key_2026';

app.set('trust proxy', true);
app.use(express.json({ limit: '5mb' }));
app.use('/asset', express.static(path.join(__dirname, 'asset')));
app.use('/logoandicon', express.static(path.join(__dirname, 'asset/logoandicon')));
app.use('/logoandicon', express.static(path.join(__dirname, 'logoandicon')));

// ─── DEFAULT CMS DATA ───
const DEFAULT_CMS = {
  settings: {
    whatsapp_number: '6281991947017',
    whatsapp_greeting: 'Halo Paras Digital, saya ingin konsultasi pembuatan website / web app.',
    domain_display: 'parasdigital.id',
    email: 'halo@parasdigital.id',
    city: 'Indonesia',
    hosting_price: '150rb',
    dp_percent: '50'
  },
  pricing_website: [
    {
      name: 'Landing Page',
      desc: 'Cocok untuk promosi satu produk atau jasa.',
      price: '800 Rb',
      badge1: 'Sekali bayar',
      badge2: 'Selesai ±2 hari',
      featured: false,
      cta_text: 'Pilih paket',
      features: [
        '1 halaman, rapi di HP',
        'Tombol WhatsApp & formulir',
        'Domain, hosting & SSL tahun pertama',
        'SEO dasar'
      ]
    },
    {
      name: 'Company Profile',
      desc: 'Cocok untuk bisnis yang butuh wajah resmi online.',
      price: '1,55 Jt',
      badge1: 'Sekali bayar',
      badge2: 'Selesai ±1 minggu',
      featured: true,
      popular_label: 'Paling populer',
      cta_text: 'Pilih paket',
      features: [
        '5–8 halaman + blog',
        'SEO dasar & Google Maps',
        'Desain sesuai identitas bisnis',
        'Formulir kontak & WhatsApp',
        'Domain, hosting & SSL tahun pertama',
        'Revisi sesuai paket'
      ]
    },
    {
      name: 'Website Custom',
      desc: 'Cocok untuk brand yang butuh tampilan dan fitur khusus.',
      price: '3,4 Jt',
      badge1: 'Sekali bayar',
      badge2: 'Selesai ±2 minggu',
      featured: false,
      cta_text: 'Diskusikan kebutuhan',
      features: [
        'Desain eksklusif dari nol',
        'Animasi & interaksi khusus',
        'Integrasi (pembayaran, peta, dll.)',
        'Panel admin untuk mengelola konten',
        'Domain, hosting & SSL tahun pertama'
      ]
    }
  ],
  pricing_webapp: [
    {
      name: 'Starter',
      desc: 'Cocok untuk satu proses yang ingin dirapikan.',
      price: '5 Jt',
      badge1: 'Sekali bayar',
      badge2: 'Selesai ±3 minggu',
      featured: false,
      cta_text: 'Pilih paket',
      features: [
        '1 modul utama (misalnya pesanan)',
        'Login pengguna',
        'Database & laporan dasar',
        'Nyaman di HP dan komputer',
        'Dukungan setelah rilis'
      ]
    },
    {
      name: 'Bisnis',
      desc: 'Cocok untuk operasional beberapa bagian sekaligus.',
      price: '12 Jt',
      badge1: 'Sekali bayar',
      badge2: 'Selesai ±6 minggu',
      featured: true,
      popular_label: 'Paling populer',
      cta_text: 'Pilih paket',
      features: [
        'Beberapa modul yang saling terhubung',
        'Peran pengguna (admin, staf)',
        'Dashboard & laporan',
        'Ekspor data ke Excel/PDF',
        'Pelatihan penggunaan untuk tim'
      ]
    },
    {
      name: 'Kustom',
      desc: 'Cocok untuk kebutuhan besar atau terhubung ke sistem lain.',
      price: '25 Jt',
      badge1: 'Sesuai ruang lingkup',
      badge2: 'Selesai ±2 bulan',
      featured: false,
      cta_text: 'Minta penawaran',
      features: [
        'Analisis kebutuhan mendalam',
        'Integrasi dengan sistem lain (API)',
        'Alur kerja dan aturan khusus',
        'Hak akses dan keamanan lanjutan',
        'Dukungan prioritas'
      ]
    }
  ],
  portfolio: [
    {
      num: '01',
      title: 'Klinik Sehat Sentosa',
      category: 'Website',
      image_url: '',
      image_placeholder: '[Tangkapan layar proyek 01]',
      summary: 'Masalah: Pasien sulit cek jadwal dokter. Solusi: Website profil & jadwal terintegrasi WA. Hasil: Booking via online naik 3x lipat.'
    },
    {
      num: '02',
      title: 'Distribusi Nusantara',
      category: 'Web app',
      image_url: '',
      image_placeholder: '[Tangkapan layar proyek 02]',
      summary: 'Masalah: Stok gudang sering selisih di Excel. Solusi: Web app stok & pesanan real-time. Hasil: Rekap bulanan selesai dalam hitungan detik.'
    },
    {
      num: '03',
      title: 'Kopi Roastery Lokal',
      category: 'Dashboard',
      image_url: '',
      image_placeholder: '[Tangkapan layar proyek 03]',
      summary: 'Masalah: Pesanan B2B tercecer di chat. Solusi: Portal order klien & dashboard penjualan. Hasil: Tidak ada lagi pesanan terlewat.'
    }
  ]
};

// ─── INISIALISASI DATABASE OTOMATIS ───
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGSERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL DEFAULT 'pageview',
        event_label VARCHAR(150) DEFAULT '',
        visitor_hash VARCHAR(64) NOT NULL,
        path VARCHAR(255) DEFAULT '/',
        referrer TEXT DEFAULT '',
        device_type VARCHAR(20) DEFAULT 'desktop',
        browser VARCHAR(50) DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events (created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_visitor_hash ON analytics_events (visitor_hash);

      CREATE TABLE IF NOT EXISTS cms_content (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default CMS data jika belum ada
    for (const [key, val] of Object.entries(DEFAULT_CMS)) {
      await pool.query(
        `INSERT INTO cms_content (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(val)]
      );
    }
    // Update nomor WhatsApp bawaan jika masih nomor contoh dummy
    await pool.query(`
      UPDATE cms_content
      SET value = jsonb_set(value, '{whatsapp_number}', '"6281991947017"')
      WHERE key = 'settings' AND value->>'whatsapp_number' = '6281234567890'
    `);
    console.log('✅ PostgreSQL terhubung & tabel siap digunakan.');
  } catch (err) {
    console.error('⚠️ Gagal konek / inisialisasi PostgreSQL:', err.message);
    console.error('   Pastikan DATABASE_URL di file .env sudah sesuai dengan PostgreSQL Anda.');
  }
}
initDB();

// ─── HELPER DETEKSI DEVICE & BROWSER ───
function parseUserAgent(ua = '') {
  const s = ua.toLowerCase();
  let device = 'desktop';
  if (/ipad|tablet|playbook|silk/.test(s)) device = 'tablet';
  else if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(s)) device = 'mobile';

  let browser = 'Lainnya';
  if (s.includes('edg/')) browser = 'Edge';
  else if (s.includes('opr/') || s.includes('opera')) browser = 'Opera';
  else if (s.includes('chrome/') && !s.includes('edg/')) browser = 'Chrome';
  else if (s.includes('safari/') && !s.includes('chrome/')) browser = 'Safari';
  else if (s.includes('firefox/')) browser = 'Firefox';

  return { device, browser };
}

function getVisitorHash(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
  const ua = req.headers['user-agent'] || '';
  const today = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${ip}|${ua}|${today}|${ADMIN_SECRET}`).digest('hex').slice(0, 32);
}

// ─── HELPER AUTH TOKEN ───
function createToken(username) {
  const payload = JSON.stringify({ u: username, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyToken(token = '') {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(b64).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.admin = user;
  next();
}

// ─── API PUBLIC: AMBIL KONTEN CMS ───
app.get('/api/content', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM cms_content');
    const result = { ...DEFAULT_CMS };
    rows.forEach(r => {
      result[r.key] = r.value;
    });
    res.json(result);
  } catch (err) {
    // Fallback ke default jika DB belum siap
    res.json(DEFAULT_CMS);
  }
});

// ─── API PUBLIC: CATAT TRAFFIC & KLIK ───
app.post('/api/track', async (req, res) => {
  try {
    const { event_type = 'pageview', event_label = '', path: pagePath = '/', referrer = '' } = req.body || {};
    const { device, browser } = parseUserAgent(req.headers['user-agent']);
    const visitor_hash = getVisitorHash(req);

    // Abaikan tracking jika dari halaman /admin
    if (String(pagePath).startsWith('/admin')) {
      return res.json({ ok: true, skipped: true });
    }

    await pool.query(
      `INSERT INTO analytics_events (event_type, event_label, visitor_hash, path, referrer, device_type, browser)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        String(event_type).slice(0, 50),
        String(event_label).slice(0, 150),
        visitor_hash,
        String(pagePath).slice(0, 255),
        String(referrer).slice(0, 500),
        device,
        browser
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: false });
  }
});

// ─── API ADMIN: LOGIN ───
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: createToken(username), username });
  }
  return res.status(401).json({ error: 'Username atau password salah' });
});

// ─── API ADMIN: STATISTIK TRAFFIC ───
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days || '14', 10)));
  try {
    // Ringkasan total dalam periode
    const summaryQ = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE event_type = 'pageview') AS total_pageviews,
         COUNT(DISTINCT visitor_hash) FILTER (WHERE event_type = 'pageview') AS unique_visitors,
         COUNT(*) FILTER (WHERE event_type = 'wa_click') AS wa_clicks,
         COUNT(*) FILTER (WHERE event_type = 'plan_click') AS plan_clicks
       FROM analytics_events
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );

    // Hari ini
    const todayQ = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE event_type = 'pageview') AS today_pageviews,
         COUNT(DISTINCT visitor_hash) FILTER (WHERE event_type = 'pageview') AS today_visitors,
         COUNT(*) FILTER (WHERE event_type = 'wa_click') AS today_wa_clicks
       FROM analytics_events
       WHERE created_at >= CURRENT_DATE`
    );

    // Grafik harian
    const dailyQ = await pool.query(
      `SELECT
         TO_CHAR(d::date, 'YYYY-MM-DD') AS date,
         TO_CHAR(d::date, 'DD Mon') AS label,
         COALESCE(COUNT(a.id) FILTER (WHERE a.event_type = 'pageview'), 0)::int AS pageviews,
         COALESCE(COUNT(DISTINCT a.visitor_hash) FILTER (WHERE a.event_type = 'pageview'), 0)::int AS visitors,
         COALESCE(COUNT(a.id) FILTER (WHERE a.event_type = 'wa_click'), 0)::int AS wa_clicks
       FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, '1 day') AS d
       LEFT JOIN analytics_events a
         ON DATE(a.created_at AT TIME ZONE 'Asia/Jakarta') = d::date
       GROUP BY d
       ORDER BY d ASC`,
      [days]
    );

    // Breakdown perangkat
    const deviceQ = await pool.query(
      `SELECT device_type, COUNT(*)::int AS count
       FROM analytics_events
       WHERE event_type = 'pageview' AND created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY device_type
       ORDER BY count DESC`,
      [days]
    );

    // Breakdown browser
    const browserQ = await pool.query(
      `SELECT browser, COUNT(*)::int AS count
       FROM analytics_events
       WHERE event_type = 'pageview' AND created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY browser
       ORDER BY count DESC`,
      [days]
    );

    // Top Referrer
    const referrerQ = await pool.query(
      `SELECT
         CASE WHEN referrer = '' OR referrer IS NULL THEN 'Langsung (Direct)' ELSE referrer END AS source,
         COUNT(*)::int AS count
       FROM analytics_events
       WHERE event_type = 'pageview' AND created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY source
       ORDER BY count DESC
       LIMIT 8`,
      [days]
    );

    // Klik Tombol / Paket Terpopuler
    const clicksQ = await pool.query(
      `SELECT event_type, event_label, COUNT(*)::int AS count
       FROM analytics_events
       WHERE event_type IN ('wa_click', 'plan_click')
         AND created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY event_type, event_label
       ORDER BY count DESC
       LIMIT 10`,
      [days]
    );

    // Aktivitas terbaru (Live log 15 terakhir)
    const recentQ = await pool.query(
      `SELECT event_type, event_label, device_type, browser, referrer,
              TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'DD Mon HH24:MI') AS time_str
       FROM analytics_events
       ORDER BY created_at DESC
       LIMIT 15`
    );

    res.json({
      summary: summaryQ.rows[0],
      today: todayQ.rows[0],
      daily: dailyQ.rows,
      devices: deviceQ.rows,
      browsers: browserQ.rows,
      referrers: referrerQ.rows,
      clicks: clicksQ.rows,
      recent: recentQ.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API ADMIN: SIMPAN KONTEN CMS ───
app.put('/api/admin/content/:key', requireAdmin, async (req, res) => {
  const { key } = req.params;
  const allowedKeys = ['settings', 'pricing_website', 'pricing_webapp', 'portfolio'];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ error: 'Key tidak valid' });
  }
  try {
    await pool.query(
      `INSERT INTO cms_content (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES HALAMAN HTML ───
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/layanan-website', (req, res) => {
  res.sendFile(path.join(__dirname, 'layanan-website.html'));
});

app.get('/layanan-webapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'layanan-webapp.html'));
});

app.get('/layanan-maintenance', (req, res) => {
  res.sendFile(path.join(__dirname, 'layanan-maintenance.html'));
});

// ─── SEO MESIN PENCARI ───
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`🚀 Server Paras Digital berjalan di http://localhost:${PORT}`);
  console.log(`🔒 Dashboard CMS & Traffic Monitor: http://localhost:${PORT}/admin`);
});

