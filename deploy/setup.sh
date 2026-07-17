#!/usr/bin/env bash
# ============================================================
# Kodu Sandbox — VPS суулгах скрипт (Ubuntu 22.04 / 24.04)
# ============================================================
# Шинэ VPS дээр root эрхээр НЭГ УДАА ажиллуулна:
#
#   curl -fsSL https://raw.githubusercontent.com/Zulzaga0428/SAND/main/deploy/setup.sh | bash
#
# Юу хийдэг вэ:
#   1. Docker суулгана
#   2. Node.js 20 суулгана
#   3. SAND repo-г /opt/kodu-sandbox руу татна
#   4. Next.js template image build хийнэ
#   5. Controller-ыг systemd service болгоно (унтраад асахад өөрөө асна)
#   6. Галт хана (ufw) тохируулна
# ============================================================
set -euo pipefail

echo "=== [1/6] Docker суулгаж байна..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "=== [2/6] Node.js 20 суулгаж байна..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "=== [3/6] SAND repo татаж байна..."
if [ -d /opt/kodu-sandbox/.git ]; then
  git -C /opt/kodu-sandbox pull
else
  git clone https://github.com/Zulzaga0428/SAND.git /opt/kodu-sandbox
fi

echo "=== [4/6] Next.js template image build хийж байна (хэдэн минут)..."
docker build -t kodu-template-next /opt/kodu-sandbox/template

echo "=== [5/6] Controller тохируулж байна..."
cd /opt/kodu-sandbox/controller
npm install --omit=dev --no-audit --no-fund

cat > /etc/systemd/system/kodu-sandbox.service <<'EOF'
[Unit]
Description=Kodu Sandbox Controller
After=docker.service network-online.target
Requires=docker.service

[Service]
WorkingDirectory=/opt/kodu-sandbox/controller
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
Environment=PORT=4000
Environment=WARM_POOL_SIZE=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now kodu-sandbox

echo "=== [6/6] Галт хана тохируулж байна..."
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp    # SSH
  ufw allow 4000/tcp  # Controller API + самбар
  # Preview контейнерууд санамсаргүй өндөр порт авдаг
  ufw allow 32768:65535/tcp
  ufw --force enable
fi

echo ""
echo "============================================================"
echo "  🐳 Kodu Sandbox VPS дээр АМЬД боллоо!"
echo "  Самбар:      http://$(curl -s ifconfig.me):4000"
echo "  API түлхүүр: $(cat /opt/kodu-sandbox/controller/.kodu-key 2>/dev/null || echo 'service ассаны дараа үүснэ — journalctl -u kodu-sandbox | grep түлхүүр')"
echo "  Статус:      systemctl status kodu-sandbox"
echo "  Лог:         journalctl -u kodu-sandbox -f"
echo "============================================================"
