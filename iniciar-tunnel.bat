@echo off
title Cardapio Digital - Servidor + Tunnel
color 0A

echo ============================================
echo    CARDAPIO DIGITAL - Iniciando sistema
echo ============================================
echo.

cd /d "%~dp0"

:: Verifica se a pasta .next existe (se ja foi feito build)
if not exist ".next" (
    echo [AVISO] Build de producao nao encontrado.
    echo Executando 'npm run build' pela primeira vez...
    call npm run build
    echo.
)

:: Inicia o servidor Next.js
echo [1/2] Iniciando servidor Next.js na porta 3001...
start "Next.js Server" cmd /k "cd /d ""%~dp0"" && npm run start"

:: Aguarda o servidor iniciar
echo      Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

:: Inicia o tunnel Cloudflare com o tunel fixo (ascani-erva-doce.com.br)
echo [2/2] Iniciando tunnel Cloudflare...
echo       Dominio: ascani-erva-doce.com.br
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --config ""%~dp0config.yml"" run 4bc66d69-b9a7-4b32-90da-4d8ea868c542"

echo.
echo ============================================
echo   Sistema iniciado!
echo   Site: https://ascani-erva-doce.com.br
echo ============================================
echo.
timeout /t 6
