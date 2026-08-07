@echo off
title Card Clash - Build Standalone Bundle
echo ========================================================
echo   📦 COMPILAZIONE CARD CLASH STANDALONE
echo ========================================================
echo.

cd /d "%~dp0"

IF NOT EXIST node_modules (
    echo [*] Installazione delle dipendenze...
    call npm install
)

echo [*] Compilazione bundle frontend con Vite...
call npm run build

echo.
echo [*] Creazione cartella Standalone portatile pronta all'uso...
if not exist "dist-standalone" mkdir "dist-standalone"
xcopy /E /I /Y "dist" "dist-standalone\public"
copy /Y "server\index.js" "dist-standalone\server.js"
copy /Y "package.json" "dist-standalone\package.json"

echo @echo off > "dist-standalone\Avvia-CardClash.bat"
echo title Card Clash Standalone Launcher >> "dist-standalone\Avvia-CardClash.bat"
echo node server.js >> "dist-standalone\Avvia-CardClash.bat"
echo pause >> "dist-standalone\Avvia-CardClash.bat"

echo.
echo ========================================================
echo   COMPILAZIONE COMPLETATA!
echo   La cartella dist-standalone contiene il gioco pronto!
echo ========================================================
pause
