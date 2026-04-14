@echo off
title BotTerminal - LYHU Automation
chcp 65001 > nul
cd /d "G:\LYHU\Projects\LYHU-app"
echo --- DEBUG INFO ---
echo Script: "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js"
echo Args: "Việc làm telesales hà nội   | job |  8"
echo Profile: ".bot_profile_lanlyhu"
echo CMD Line: node "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js" "Việc làm telesales hà nội   | job |  8" --profile=".bot_profile_lanlyhu"
echo --- END DEBUG ---
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js" "Việc làm telesales hà nội   | job |  8" --profile=".bot_profile_lanlyhu"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul