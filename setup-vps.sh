#!/usr/bin/env bash
set -e

echo "====================================================="
echo "🚀 SETUP OTOMATIS VPS PARAS DIGITAL (Ubuntu/Debian)"
echo "====================================================="

# 1. Update system & install paket dasar
echo "📦 [1/6] Mengupdate sistem & menginstall Git, Curl, Nginx, PostgreSQL..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# 2. Install Node.js 20 LTS & PM2
if ! command -v node &> /dev/null; then
  echo "🟢 [2/6] Menginstall Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "🟢 [2/6] Node.js sudah terinstall: $(node -v)"
fi

echo "⚙️ Menginstall PM2..."
sudo npm install -g pm2

# 3. Setup Database PostgreSQL
DB_NAME="parasdigital"
DB_USER="parasuser"
DB_PASS="parasdb_$(openssl rand -hex 6)"

echo "🐘 [3/6] Menyiapkan database PostgreSQL ($DB_NAME)..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# 4. Setup .env jika belum ada
echo "🔐 [4/6] Menyiapkan file konfigurasi .env..."
if [ ! -f .env ]; then
  ADMIN_SECRET_GEN=$(openssl rand -hex 16)
  cat > .env <<EOF
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
ADMIN_USER=admin
ADMIN_PASS=parasdigital2026
ADMIN_SECRET=${ADMIN_SECRET_GEN}
EOF
  echo "✅ File .env berhasil dibuat otomatis."
else
  echo "ℹ️ File .env sudah ada, tidak ditimpa."
fi

# 5. Install dependency Node.js & jalankan dengan PM2
echo "🚀 [5/6] Menginstall dependency aplikasi & menjalankan PM2..."
npm install --omit=dev
pm2 delete parasdigital 2>/dev/null || true
pm2 start server.js --name parasdigital
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

# 6. Setup Nginx Reverse Proxy
echo "🌐 [6/6] Mengatur Nginx Reverse Proxy..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo tee /etc/nginx/sites-available/parasdigital > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/parasdigital /etc/nginx/sites-enabled/parasdigital
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "====================================================="
echo "✅ SELESAI! Website & CMS Paras Digital sudah aktif!"
echo "👉 Buka Website : http://IP_VPS_ANDA/"
echo "👉 Buka CMS     : http://IP_VPS_ANDA/admin"
echo "   User Admin   : admin"
echo "   Pass Admin   : parasdigital2026 (bisa diubah di .env)"
echo "====================================================="

