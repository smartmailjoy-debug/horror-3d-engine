@echo off
rem Picks a browser for Remotion: its own Chrome Headless Shell if it downloads, else installed Chrome, else Edge.
set BROWSER=
call npx remotion browser ensure >nul 2>nul
if %errorlevel%==0 goto :eof
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set BROWSER=--browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"& goto :eof
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set BROWSER=--browser-executable="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"& goto :eof
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set BROWSER=--browser-executable="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"& goto :eof
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set BROWSER=--browser-executable="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"& goto :eof
echo Koi browser nahi mila. Google Chrome install karke dobara chalao.
