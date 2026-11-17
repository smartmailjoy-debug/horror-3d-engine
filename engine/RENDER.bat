@echo off
cd /d "%~dp0"
echo === TOWER 13 render (GPU) ===
where node >nul 2>nul || (echo Node.js 22 LTS install karo: https://nodejs.org & pause & exit /b)
if not exist node_modules call npm install
if not exist out mkdir out
call _browser.bat
echo Browser: %BROWSER%
call npx remotion render src/index.ts TOWER13 out/TOWER13.mp4 %BROWSER% --gl=angle --concurrency=2 --timeout=900000 --codec=h264 --crf=18 --x264-preset=veryfast
if errorlevel 1 (echo. & echo RENDER FAIL hua - upar ka error screenshot bhejo.) else (echo Done: out\TOWER13.mp4)
pause
