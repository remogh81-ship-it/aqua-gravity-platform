@echo off
title AquaGravity Native Launcher
echo ==================================================
echo    AquaGravity Native Launcher (No Docker Needed)       
echo ==================================================
echo.
echo [*] Starting FastAPI Backend on Port 8000...
start cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 5 >nul

echo [*] Starting React/Vite Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo [✓] Servers are launching in separate windows!
echo --------------------------------------------------
echo • Frontend (UI): Check the Node.js window for the URL (Usually http://localhost:5173)
echo • Backend (API): http://localhost:8000/docs
echo --------------------------------------------------
pause
