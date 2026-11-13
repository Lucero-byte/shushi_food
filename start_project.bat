@echo off
title Kaiseki Sushi Bar - Servidores
echo ========================================================
echo   KAISEKI SUSHI BAR - INICIANDO SISTEMA INTEGRAL
echo   Backend: Django REST Framework (Puerto 8000)
echo   Frontend: React + Vite (Puerto 5173 / Proxy 8000)
echo ========================================================

REM Iniciar backend Django en una ventana
start "Kaiseki Backend (Django)" cmd /k "cd /d %~dp0 && .\.venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

REM Iniciar frontend React Vite en otra ventana
start "Kaiseki Frontend (React)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo Servidores ejecutandose:
echo - Frontend SPA: http://localhost:5173
echo - Backend API:  http://127.0.0.1:8000/api/
echo - Panel Django: http://127.0.0.1:8000/admin/
echo - SPA Unificada: http://127.0.0.1:8000/
echo.
pause

