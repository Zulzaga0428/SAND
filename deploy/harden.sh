#!/usr/bin/env bash
# ============================================================
# Kodu Sandbox — Сүлжээний ХАМГААЛАЛТ (egress firewall)
# ============================================================
# Sandbox контейнеруудын ГАДАГШ хандалтыг хаана. Хортой хэрэглэгчийн код:
#   - интернэт рүү дайрах (DDoS, скан, спам)
#   - cloud метадата хулгайлах (169.254.169.254)
#   - host серверийн бусад үйлчилгээ рүү орох
#   ...БҮГД хаагдана. Inbound preview үйлчилгээ (established) хэвээрээ.
#
# Сервер дээр root эрхээр НЭГ УДАА ажиллуулна:
#   sudo bash /opt/kodu-sandbox/deploy/harden.sh
# ============================================================
set -euo pipefail
NETWORK=kodu-sandbox-net

echo "=== [1/3] Тусгаарлагдсан сүлжээ шалгаж байна..."
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
  docker network create --driver bridge \
    -o com.docker.network.bridge.enable_icc=false "$NETWORK"
  echo "  '$NETWORK' үүсгэлээ"
fi

echo "=== [2/3] Галт ханын apply скрипт суулгаж байна..."
cat > /usr/local/bin/kodu-firewall.sh <<'SCRIPT'
#!/usr/bin/env bash
# Sandbox сүлжээний egress-ийг хаана. Ачаалах бүрт (docker-ийн дараа) ажиллана.
set -euo pipefail
NETWORK=kodu-sandbox-net
SUBNET=$(docker network inspect "$NETWORK" \
  -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null || true)
if [ -z "$SUBNET" ]; then
  echo "kodu-firewall: '$NETWORK' сүлжээ алга — алгаслаа"
  exit 0
fi

# DOCKER-USER чиний дүрмийг Docker-ийн дүрмээс ТҮРҮҮ шалгадаг (найдвартай цэг).
# Хуучин дүрмээ цэвэрлэ (идемпотент — олон удаа ажиллуулж болно)
while iptables -D DOCKER-USER -s "$SUBNET" ! -d "$SUBNET" \
      -m conntrack --ctstate NEW -j DROP 2>/dev/null; do :; done

# 🔒 Sandbox subnet-ээс ГАДАГШ (өөр subnet, host, интернэт, метадата) руу
# ШИНЭ холболт эхлүүлэхийг хориглоно. Established (preview-д хариу өгөх) хэвээрээ.
iptables -I DOCKER-USER -s "$SUBNET" ! -d "$SUBNET" \
  -m conntrack --ctstate NEW -j DROP

echo "kodu-firewall: $SUBNET egress хаагдлаа ✅"
SCRIPT
chmod +x /usr/local/bin/kodu-firewall.sh

echo "=== [3/3] systemd unit (ачаалах бүрт автомат) суулгаж байна..."
cat > /etc/systemd/system/kodu-firewall.service <<'EOF'
[Unit]
Description=Kodu Sandbox egress firewall
After=docker.service kodu-sandbox.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/kodu-firewall.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kodu-firewall >/dev/null 2>&1
/usr/local/bin/kodu-firewall.sh # одоо шууд хэрэглэ

echo ""
echo "============================================================"
echo "  🔒 Egress галт хана суусан. Сервер unтраад асахад автомат сэргэнэ."
echo "  Шалгах:  sudo bash /opt/kodu-sandbox/deploy/redteam-test.sh"
echo "============================================================"
