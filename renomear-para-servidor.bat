@echo off
:: Verifica permissao de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permissao de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

chcp 65001 > nul
cls
echo ======================================================
echo 💻 ALTERANDO NOMES DO WINDOWS PARA SERVIDOR
echo ======================================================
echo.
echo 1. Alterando nome do Usuário (TOTEM -> servidor)...
powershell -NoProfile -Command "Rename-LocalUser -Name 'TOTEM' -NewName 'servidor' -ErrorAction SilentlyContinue"
echo    [OK] Nome do usuário configurado como 'servidor'.
echo.
echo 2. Alterando nome do Computador para 'SERVIDOR'...
powershell -NoProfile -Command "Rename-Computer -NewName 'SERVIDOR' -Force -ErrorAction SilentlyContinue"
echo    [OK] Nome do computador configurado como 'SERVIDOR'.
echo.
echo ======================================================
echo ✅ PRONTO!
echo.
echo Após reiniciar o computador, ao digitar:
echo      whoami
echo o resultado será:
echo      servidor\servidor
echo ======================================================
echo.
pause
