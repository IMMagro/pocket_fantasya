@echo off
title Card Clash - TCG Studio & Arena Launcher
echo ========================================================
echo   🃏 AVVIO CARD CLASH: TCG ARENA ^& STUDIO
echo ========================================================
echo.

cd /d "%~dp0"

IF NOT EXIST node_modules (
    echo [*] Installazione delle dipendenze in corso...
    call npm install
    if errorlevel 1 (
        echo [!] Errore durante l'installazione delle dipendenze.
        pause
        exit /b %errorlevel%
    )
)

echo [*] Avvio del Server Multiplayer e dell'Interfaccia Web...
start cmd /k "title Card Clash Server & npm run server"
timeout /t 2 /nobreak >nul
start cmd /k "title Card Clash Client & npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo   CARD CLASH E' PRONTO!
echo   Puoi giocare in locale o passare il tuo IP al collega!
echo ========================================================
