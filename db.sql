-- Skema Database PostgreSQL untuk Paras Digital (Traffic Analytics + CMS)
-- Catatan: server.js juga otomatis menjalankan query ini saat pertama kali dijalankan.

-- 1. Tabel Traffic & Klik Event (Pageview, Klik WhatsApp, Klik Paket)
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL DEFAULT 'pageview', -- 'pageview', 'wa_click', 'plan_click'
  event_label VARCHAR(150) DEFAULT '',                -- misal: 'Hero WA', 'Paket Company Profile'
  visitor_hash VARCHAR(64) NOT NULL,                  -- hash harian anonim (IP + User-Agent) untuk hitung Unique Visitor
  path VARCHAR(255) DEFAULT '/',
  referrer TEXT DEFAULT '',
  device_type VARCHAR(20) DEFAULT 'desktop',          -- 'mobile', 'desktop', 'tablet'
  browser VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_hash ON analytics_events (visitor_hash);

-- 2. Tabel Konten CMS (Key-Value JSONB untuk Pengaturan, Paket Harga, dan Portofolio)
CREATE TABLE IF NOT EXISTS cms_content (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

