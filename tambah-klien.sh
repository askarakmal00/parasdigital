#!/usr/bin/env bash
set -e

# Script untuk menambah Domain + Database PostgreSQL Klien Baru di VPS
# Cara pakai:
#   bash tambah-klien.sh domainklien.com 3001 nama_db_klien

DOMAIN=$1
PORT=$2
DB_NAME=$3

if [ -z "$DOMAIN" ] || [ -z "$PORT" ]; then
  echo "Cara pakai: bash tambah-klien.sh <domain_klien> <port_app> [nama_database_opsional]"
  echo "Contoh    : bash tambah-klien.sh absensi.klien.com 3001 db_absensi"
  exit 1
fi

echo "🌐 Menambahkan konfigurasi Nginx untuk $DOMAIN -> localhost:$PORT..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
sudo nginx -t
sudo systemctl reload nginx
echo "✅ Nginx untuk $DOMAIN aktif (Port $PORT)."

if [ -n "$DB_NAME" ]; then
  DB_USER="${DB_NAME}_user"
  DB_PASS="pass_$(openssl rand -hex 6)"
  echo "🐘 Membuat database PostgreSQL '$DB_NAME'..."
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
  sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
  echo "✅ Database '$DB_NAME' siap!"
  echo "   DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
fi

echo "🔒 Untuk mengaktifkan HTTPS (SSL) setelah DNS domain mengarah ke VPS, jalankan:"
echo "   sudo certbot --nginx -d $DOMAIN"
