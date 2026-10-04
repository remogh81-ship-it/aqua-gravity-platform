#!/usr/bin/env bash
set -e

echo "=================================================="
echo "    AquaGravity-Platform One-Click Launcher       "
echo "=================================================="

# التحقق من تثبيت Docker
if ! command -v docker &> /dev/null; then
    echo "[!] خطأ: Docker غير مثبت. يرجى تثبيته للمتابعة."
    exit 1
fi

# التحقق من توفر docker compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "[!] خطأ: Docker Compose غير مثبت."
    exit 1
fi

echo "[*] جاري بناء الحاويات وتجهيز المنظومة..."
$DOCKER_COMPOSE_CMD down
$DOCKER_COMPOSE_CMD up --build -d

echo ""
echo "[✓] تم تشغيل المنظومة بنجاح!"
echo "--------------------------------------------------"
echo "• الواجهة التفاعلية (الموقع):   http://localhost"
echo "• توثيق محرك الحسابات (Swagger): http://localhost:8000/docs"
echo "--------------------------------------------------"
echo "للإيقاف، قم بتشغيل: $DOCKER_COMPOSE_CMD down"
