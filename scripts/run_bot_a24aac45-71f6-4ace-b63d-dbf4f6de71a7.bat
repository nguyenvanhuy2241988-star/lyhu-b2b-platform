@echo off
title BotTerminal - LYHU Automation
chcp 65001 > nul
cd /d "G:\LYHU\Projects\LYHU-app"
echo --- DEBUG INFO ---
echo Script: "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_profile.js"
echo Args: "CVT"
echo Profile: ".bot_profile"
echo CMD Line: node "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_profile.js" "CVT" --profile=".bot_profile"
echo --- END DEBUG ---
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_profile.js" "CVT" --profile=".bot_profile"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul