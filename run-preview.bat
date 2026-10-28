@echo off
cd /d "%~dp0"
echo Starting site at http://localhost:8000 (close this window to stop)
start "" http://localhost:8000
where py >nul 2>nul && (py -m http.server 8000 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 & goto :eof)
where npx >nul 2>nul && (npx --yes serve -l 8000 . & goto :eof)
echo Neither Python nor Node found. Install Python from python.org, or use VS Code "Live Server" on index.html.
pause
