@echo off
title Farm+ Hub Web Launcher
chcp 65001 >nul
cls

echo ========================================================
echo               FARM+ HUB WEB SERVER v2.0
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден на компьютере!
    echo Скачайте и установите Node.js с официального сайта:
    echo https://nodejs.org (рекомендуется версия LTS)
    echo.
    pause
    exit /b
)

if not exist node_modules (
    echo [1/2] Установка необходимых библиотек (npm install)...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [Попытка 2] Повтор с флагом --force...
        call npm install --force
    )
    echo.
)

echo [2/2] Запуск сервера Farm+ Hub...
echo.
echo ========================================================
echo  Панель управления доступна по адресам:
echo.
echo  - На этом ПК (браузер):  http://localhost:3000
echo.
echo  - Со смартфона (Wi-Fi):  http://ВАШ_IP_В_СЕТИ:3000
echo    (Узнать IP можно командой ipconfig в командной строке)
echo ========================================================
echo.

call npm run dev
pause
