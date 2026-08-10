@echo off
title Pocket Fantasya - Compila Client EXE
cd /d "%~dp0"
echo ========================================================
echo   COMPILAZIONE CLIENT STANDALONE (l'exe per i colleghi)
echo ========================================================
echo.

IF NOT EXIST node_modules (
    echo [*] Installazione dipendenze in corso...
    call npm install
    if errorlevel 1 ( echo [!] Errore installazione dipendenze. & pause & exit /b 1 )
)

echo [*] Compilo la nuova UI e genero l'eseguibile portatile...
call npm run dist:exe
if errorlevel 1 (
    echo.
    echo [!] Errore durante la compilazione. Se e' un EPERM/rename, chiudi eventuali
    echo     finestre del gioco/dev server e riprova.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   FATTO!  Eseguibile pronto:  dist-exe\Pocket-Fantasya.exe
echo.
echo   - Copialo ai colleghi (chiavetta o cartella condivisa).
echo   - Al PRIMO avvio inseriranno l'IP del TUO PC (l'hub).
echo   - Tu tieni acceso il server con run-game.bat.
echo ========================================================
start "" "%~dp0dist-exe"
pause
