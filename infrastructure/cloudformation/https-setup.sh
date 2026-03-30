#!/usr/bin/env bash
# https-setup.sh — Install SSL certificate via Let's Encrypt on EC2
# Run this ON the EC2 instance AFTER DNS has propagated.
# Usage: bash infrastructure/cloudformation/https-setup.sh

set -euo pipefail

read -rp "Your domain name (e.g. api.plxyground.com): " DOMAIN
read -rp "Your email address (for Let's Encrypt): " EMAIL

echo ""
echo "=== Installing Certbot ==="
dnf install -y python3-certbot-nginx

echo ""
echo "=== Obtaining SSL certificate for $DOMAIN ==="
certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domains "$DOMAIN" \
  --redirect

echo ""
echo "=== Setting up auto-renewal ==="
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

echo ""
echo "=== Verifying nginx config ==="
nginx -t && systemctl reload nginx

echo ""
echo "SSL setup complete!"
echo "Your API is now available at: https://$DOMAIN"
echo ""
echo "Test it:"
echo "  curl https://$DOMAIN/healthz"
