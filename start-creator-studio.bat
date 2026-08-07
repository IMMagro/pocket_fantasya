@echo off
title Card Clash - Card Creator Studio (Esclusivo)
echo ========================================================
echo   CARD CLASH: CARD CREATOR STUDIO (POSTAZIONE CREATORE)
echo ========================================================
echo.
echo Avvio del server backend e dello studio di creazione carte...
echo.

:: Avvia il server Node.js in background se non e' gia' attivo
start /B node server/index.js

:: Avvia Vite dev server
start /B npm run dev

:: Attendi 2 secondi e apri direttamente il Creator Studio nel browser
timeout /t 2 /nobreak >nul
start http://localhost:5173/#creator

echo.
echo Studio Creatore avviato su http://localhost:5173/#creator
echo Puoi creare le tue carte e cliccare 'Pubblica Carte sul Gioco Ufficiale'!
echo Premi un tasto per chiudere questa finestra.
pause >nul
