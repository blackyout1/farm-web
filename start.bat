@echo off
title Farm+ Hub Web Launcher
chcp 65001 >nul

echo ========================================================
echo               FARM+ HUB WEB SERVER v2.0
echo ========================================================
echo.

node -v >nul 2>&1
if errorlevel 1 goto no_node

if not exist node_modules goto do_install
if not exist node_modules\tsx goto do_install
goto start_server

:do_install
echo [1/2] Установка библиотек... Пожалуйста, подождите...
echo.
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo Повторная попытка с флагом --force...
    call npm install --force
)
echo.

:start_server
echo [2/2] Запуск веб-сервера Farm+ Hub...
echo.
echo ========================================================
echo  Панель управления:
echo  - На этом ПК:    http://localhost:3000
echo  - Со смартфона:  http://ВАШ_IP:3000
echo ========================================================
echo.
call npm run dev
pause
exit /b

:no_node
echo.
echo [ОШИБКА] Node.js не найден в системе!
echo Скачайте и установите Node.js с официального сайта: https://nodejs.org
echo После установки перезапустите этот файл.
echo.
pause
exit /b
