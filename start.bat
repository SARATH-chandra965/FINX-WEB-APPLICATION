@echo off
title FINX - 9-Step AI Scam Protection
color 0B
echo ========================================================
echo    Starting FINX (Solution Architecture)
echo ========================================================
echo.
cd /d "%~dp0"
echo Starting application and launching web browser...
python app.py --host 0.0.0.0 --port 8000
pause
