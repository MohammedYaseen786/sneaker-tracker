@echo off
rem Runs the SoleTracker production server on http://soletracker and restarts it if it stops.
rem Started hidden at Windows login by start-hidden.vbs (see install-autostart.ps1).

cd /d "%~dp0..\.."
set "PATH=C:\Program Files\nodejs;%PATH%"
set "NODE_ENV=production"
if not exist data mkdir data

rem Already running? Don't start a second copy.
netstat -ano | findstr /r /c:"127.0.0.1:80 .*LISTENING" >nul && exit /b 0

if not exist .next\BUILD_ID call npm run build >> data\server.log 2>&1

:loop
echo [%date% %time%] starting SoleTracker >> data\server.log
node node_modules\next\dist\bin\next start -p 80 -H 127.0.0.1 >> data\server.log 2>&1
echo [%date% %time%] server stopped, restarting in 5s >> data\server.log
timeout /t 5 /nobreak >nul
goto loop
