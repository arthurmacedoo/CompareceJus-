@echo off
chcp 65001 > nul
cls
echo ======================================================
echo ⚖️  COMPARECEJUS • INICIANDO AMBIENTE ONLINE E SEGURO
echo ======================================================
echo.
echo 1. Iniciando servidor local Node.js...
start "CompareceJus Local Server" /b node server.js
timeout /t 2 /nobreak > nul
echo.
echo 2. Abrindo Túnel HTTPS Seguro do Cloudflare...
echo    (Copie o link gerado abaixo para acessar do celular)
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause