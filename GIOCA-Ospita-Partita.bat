@echo off
chcp 65001 >nul
title Pocket Fantasya - OSPITA (il tuo PC fa da server)
cd /d "%~dp0"
echo ============================================================
echo    POCKET FANTASYA  -  MODALITA' OSPITE (HOST)
echo    Il TUO PC fa da server: tienilo acceso mentre giocate.
echo ============================================================
echo.

IF NOT EXIST node_modules (
    echo [*] Installazione dipendenze in corso...
    call npm install
)

echo [*] Avvio il server di gioco (hub) in una finestra dedicata...
start "Pocket Fantasya - SERVER (non chiudere)" cmd /k "cd /d %~dp0 && node server/index.js"
timeout /t 3 /nobreak >nul

echo.
echo ------------------------------------------------------------
echo    COMUNICA AI COLLEGHI QUESTO INDIRIZZO IP:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do echo        %%a
echo ------------------------------------------------------------
echo.

echo [*] Avvio il gioco...
start "" "%~dp0dist-electron\Card-Clash.exe"

echo.
echo    NEL GIOCO, alla richiesta dell'indirizzo del server, scrivi:
echo        localhost
echo    (i colleghi invece scrivono l'IP mostrato qui sopra)
echo.
echo    Per giocare in 1vs1: Arena  ^>  Sfida in rete (LAN)  ^>  Ospita
echo    e passa al collega il CODICE STANZA che compare.
echo.
pause
