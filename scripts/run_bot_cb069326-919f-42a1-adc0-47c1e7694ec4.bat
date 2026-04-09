@echo off
title BotTerminal - LYHU Automation
chcp 65001 > nul
cd /d "G:\LYHU\Projects\LYHU-app"
echo --- DEBUG INFO ---
echo Script: "%scriptPath%"
echo Args: %safeArgs%
echo Profile: "%profileFolder%"
echo CMD Line: node "%scriptPath%" %safeArgs% --profile="%profileFolder%"
echo --- END DEBUG ---
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_group.js" "https://www.facebook.com/groups/1091849588309786  Comment Tư Vấn" --profile=".bot_profile"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul