Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "              FARM+ HUB WEB SERVER v2.0                 " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "node_modules\tsx")) {
    Write-Host "[1/2] Установка необходимых библиотек..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

Write-Host ""
Write-Host "[2/2] Запуск сервера Farm+ Hub..." -ForegroundColor Green
Write-Host "Панель управления доступна: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

npm run dev
