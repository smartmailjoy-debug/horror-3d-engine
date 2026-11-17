@echo off
cd /d "%~dp0"
rem usage: RENDER_PART.bat 0 5999   (frame range; 30 fps)
if not exist node_modules call npm install
if not exist out mkdir out
call _browser.bat
call npx remotion render src/index.ts TOWER13 out/TOWER13_%1-%2.mp4 --frames=%1-%2 %BROWSER% --gl=angle --concurrency=2 --timeout=900000 --codec=h264 --crf=18 --x264-preset=veryfast
if errorlevel 1 (echo PART FAIL) else (echo Done)
pause
