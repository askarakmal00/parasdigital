#!/usr/bin/env bash
set -e

DOMAIN="parasdigital.id"

echo "====================================================="
echo "🌐 KONFIGURASI DOMAIN & SSL: $DOMAIN & www.$DOMAIN"
echo "====================================================="

# 1. Update Nginx configuration
echo "1️⃣ Mengupdate konfigurasi Nginx..."
sudo tee /etc/nginx/sites-available/parasdigital > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} _;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

sudo ln -sf /etc/nginx/sites-available/parasdigital /etc/nginx/sites-enabled/parasdigital
sudo nginx -t
sudo systemctl reload nginx
echo "✅ Konfigurasi Nginx berhasil diupdate."

# 2. Pastikan Certbot terpasang
if ! command -v certbot &> /dev/null; then
    echo "📦 Menginstall Certbot..."
    sudo apt update && sudo apt install -y certbot python3-certbot-nginx
fi

# 3. Buka Port 80 & 443 di Firewall UFW
echo "🛡️ Membuka Port 80 & 443 di firewall UFW..."
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw reload || true

# 4. Request SSL Let's Encrypt
echo "🔐 Memasang Sertifikat SSL Let's Encrypt untuk ${DOMAIN} & www.${DOMAIN}..."
echo "Pastikan DNS A Record Anda sudah mengarah ke IP VPS sebelum langkah ini."

if sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --redirect -m halo@${DOMAIN}; then
    echo "====================================================="
    echo "🎉 SELESAI! SSL HTTPS Berhasil Diaktifkan!"
    echo "👉 Buka Website : https://${DOMAIN}"
    echo "👉 Buka CMS     : https://${DOMAIN}/admin"
    echo "====================================================="
else
    echo "====================================================="
    echo "⚠️ Certbot belum bisa memverifikasi domain sekarang."
    echo "Penyebab umum: DNS domain baru masih dalam proses propagasi (butuh 5–30 menit)."
    echo "Setelah DNS aktif, cukup jalankan ulang:"
    echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    echo "====================================================="
fi
