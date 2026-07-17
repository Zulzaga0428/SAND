#!/usr/bin/env bash
# ============================================================
# Kodu Sandbox — ХАЛДЛАГЫН ТУРШИЛТ (red-team test)
# ============================================================
# "Хакер" болж контейнерээс зугтаж/халдаж үзнэ. Бүх туршилт ХААГДСАН
# (FAIL to attack = PASS for us) байх ёстой. harden.sh ажилласны дараа хий.
#
#   sudo bash /opt/kodu-sandbox/deploy/redteam-test.sh
# ============================================================
set -uo pipefail
NETWORK=kodu-sandbox-net
IMG=node:20-alpine
PASS=0
FAIL=0

ok()   { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }

# Sandbox контейнертэй ЯГ ижил хамгаалалттайгаар команд ажиллуулна
sb() {
  docker run --rm --network "$NETWORK" \
    --cap-drop ALL --security-opt no-new-privileges \
    --memory 256m --pids-limit 128 \
    "$IMG" "$@" 2>/dev/null
}

echo ""
echo "=== 1. Интернэт рүү гарах оролдлого (ХААГДСАН байх ёстой) ==="
if timeout 20 sb sh -c 'wget -T 5 -q -O- http://example.com >/dev/null'; then
  bad "Контейнер интернэт рүү гарч чадсан!"
else
  ok "Интернэт хаалттай — гадагш дайрч чадахгүй"
fi

echo "=== 2. Cloud метадата хулгайлах оролдлого (ХААГДСАН байх ёстой) ==="
if timeout 15 sb sh -c 'wget -T 5 -q -O- http://169.254.169.254/ >/dev/null'; then
  bad "Метадата уншигдсан — нууц түлхүүр алдагдаж болзошгүй!"
else
  ok "Метадата хаалттай"
fi

echo "=== 3. Linux эрх (capability) хасагдсан эсэх ==="
CAPS=$(sb cat /proc/self/status | grep CapEff | awk '{print $2}')
if [ "$CAPS" = "0000000000000000" ]; then
  ok "Бүх capability хасагдсан (CapEff=$CAPS)"
else
  bad "Capability үлдсэн: $CAPS"
fi

echo "=== 4. no-new-privileges идэвхтэй эсэх ==="
NNP=$(sb cat /proc/self/status | grep NoNewPrivs | awk '{print $2}')
if [ "$NNP" = "1" ]; then
  ok "no-new-privileges идэвхтэй (эрх нэмэгдүүлэх хаалттай)"
else
  bad "no-new-privileges идэвхгүй"
fi

echo "=== 5. Контейнер хоорондын халдлага (icc=false, ХААГДСАН байх ёстой) ==="
# Хоёр контейнер асаагаад нэгээс нь нөгөө рүү ping хийж үзнэ
V1=$(docker run -d --network "$NETWORK" "$IMG" sleep 60)
V2=$(docker run -d --network "$NETWORK" "$IMG" sleep 60)
IP1=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" "$V1")
if timeout 12 docker exec "$V2" ping -c 2 -W 2 "$IP1" >/dev/null 2>&1; then
  bad "Контейнерууд хоорондоо ярьж чадсан ($IP1)!"
else
  ok "Контейнер хооронд тусгаарлагдсан (ping хаалттай)"
fi
docker rm -f "$V1" "$V2" >/dev/null 2>&1

echo ""
echo "============================================================"
echo "  Дүн:  ✅ PASS=$PASS   ❌ FAIL=$FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "  🔒 БҮХ ХАМГААЛАЛТ БАТ — sandbox халдлагаас хамгаалагдсан!"
else
  echo "  ⚠️  Анхаар: $FAIL цоорхой байна. Дээрх FAIL мөрийг шалга."
fi
echo "============================================================"
