@echo off
title BotTerminal - LYHU Automation
chcp 65001 > nul
cd /d "G:\LYHU\Projects\LYHU-app"
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_profile.js" "Comment Tư Vấn" --profile=".bot_profile"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 10 GIAY
timeout /t 10 >nul
del "%~f0"