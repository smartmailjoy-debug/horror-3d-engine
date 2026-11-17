@echo off
cd /d "%~dp0"
rem pehle 30 second render karke speed check karo (out\TOWER13_test.mp4). Jitne minute lage x 21 = poori film ka andaaza.
if not exist node_modules call npm install
if not exist out mkdir out
call _browser.bat
echo Browser: %BROWSER%
call npx remotion render src/index.ts TOWER13 out/TOWER13_test.mp4 --frames=0-899 %BROWSER% --gl=angle --concurrency=2 --timeout=900000 --codec=h264 --crf=18 --x264-preset=veryfast
if errorlevel 1 (echo. & echo TEST FAIL hua - upar ka error screenshot bhejo.) else (echo Done: out\TOWER13_test.mp4)
pause
