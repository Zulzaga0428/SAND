#!/usr/bin/env bash
# ============================================================
# Kodu Sandbox — HTTPS + subdomain routing (Caddy)
# ============================================================
# Preview-д цэвэр HTTPS хаяг өгнө: https://<id>.<домэйн>
# Caddy автомат Let's Encrypt гэрчилгээ (on-demand TLS) авна.
#
# ОЛОН домэйн дэмжинэ (домэйн шилжилтэд хоёул зэрэг ажиллана):
#   bash https.sh prw.kodu.live prw.hisainuu.online
# Эхний домэйн = PRIMARY (шинэ preview URL үүнээр гарна).
#
# Урьдчилсан нөхцөл: домэйн БҮР дээр DNS бичлэг заасан байх:
#   A  <домэйн>     → серверийн IP   (жишээ: prw → 202.182.123.79)
#   A  *.<домэйн>   → серверийн IP   (wildcard)
# ============================================================
set -euo pipefail
if [ "$#" -lt 1 ]; then
  echo "Хэрэглээ: bash https.sh <домэйн> [домэйн2 ...]  (жишээ: prw.kodu.live prw.hisainuu.online)"
  exit 1
fi
DOMAINS=("$@")
PRIMARY="${DOMAINS[0]}"
# Caddy site нэрс: "d1, *.d1, d2, *.d2"
SITES=""
for d in "${DOMAINS[@]}"; do
  SITES="${SITES:+$SITES, }$d, *.$d"
done
# PREVIEW_DOMAIN env: таслалаар (PRIMARY эхэнд)
CSV="$(IFS=,; echo "${DOMAINS[*]}")"

echo "=== [1/5] Caddy суулгаж байна..."
if ! command -v caddy &>/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update
  apt-get install -y caddy
fi

echo "=== [2/5] Caddyfile бичиж байна ($SITES)..."
cat > /etc/caddy/Caddyfile <<EOF
{
    # on-demand TLS: subdomain болгонд гэрчилгээ хэрэгцээгээр авна.
    # Controller-ийн ask endpoint зөвхөн бодит preview subdomain-д зөвшөөрнө.
    on_demand_tls {
        ask http://localhost:4000/__caddy_ask
    }
}

$SITES {
    tls {
        on_demand
    }
    reverse_proxy localhost:4000
}
EOF

echo "=== [3/5] Controller-д PREVIEW_DOMAIN тохируулж, багц шинэчилж байна..."
mkdir -p /etc/systemd/system/kodu-sandbox.service.d
cat > /etc/systemd/system/kodu-sandbox.service.d/preview-domain.conf <<EOF
[Service]
Environment=PREVIEW_DOMAIN=$CSV
EOF
# http-proxy зэрэг шинэ багцуудыг суулгана
(cd /opt/kodu-sandbox/controller && npm install --omit=dev --no-audit --no-fund)
systemctl daemon-reload
systemctl restart kodu-sandbox

echo "=== [4/5] Галт хана — 80, 443 нээж байна..."
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

echo "=== [5/5] Caddy асааж байна..."
systemctl enable caddy
systemctl restart caddy

echo ""
echo "============================================================"
echo "  🔒 HTTPS бэлэн! Домэйн(ууд): $CSV"
echo "  Самбар:  https://$PRIMARY"
echo "  Preview: https://<id>.$PRIMARY  (шинэ preview PRIMARY-гаар)"
echo "  (Бусад домэйн ч зэрэг ажиллана — шилжилтэд preview тасрахгүй)"
echo ""
echo "  ⚠️  Эхний удаад subdomain бүрд гэрчилгээ авахад 1-2 сек."
echo "  ⚠️  Let's Encrypt: домэйн бүрд 7 хоногт ~50 шинэ гэрчилгээ (on-demand)."
echo "============================================================"
