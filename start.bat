@echo off
title AquaGravity-Platform Launcher
echo ==================================================
echo     AquaGravity-Platform One-Click Launcher       
echo ==================================================

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] خطأ: Docker غير مثبت أو غير قيد التشغيل.
    pause
    exit /b
)

echo [*] جاري تجميع الحاويات وتشغيل المنظومة...
docker compose down >nul 2>&1
docker compose up --build -d

echo.
echo [✓] تم تشغيل المنظومة بنجاح!
echo --------------------------------------------------
echo • رابط الواجهة (الموقع):    http://localhost
echo • واجهة توثيق API (Swagger): http://localhost:8000/docs
echo --------------------------------------------------
echo لإيقاف المنظومة، شغل الأمر: docker compose down
pause
