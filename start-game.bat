@echo off
title Card Clash - Gioco Ufficiale TCG
echo ========================================================
echo   CARD CLASH: GIOCO UFFICIALE (PER TE E ANTONIO)
echo ========================================================
echo.
echo Avvio del server di gioco e del client multigiocatore...
echo.

:: Avvia il server Node.js in background se non e' gia' attivo
start /B node server/index.js

:: Avvia Vite dev server
start /B npm run dev

:: Attendi 2 secondi e apri il gioco ufficiale nel browser
timeout /t 2 /nobreak >nul
start http://localhost:5173/

echo.
echo Gioco Ufficiale avviato con successo su http://localhost:5173/
echo Condividi l'indirizzo LAN con Antonio per giocare in multigiocatore!
echo Premi un tasto per chiudere questa finestra.
pause >nul
