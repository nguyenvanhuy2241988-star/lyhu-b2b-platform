@echo off
title BotTerminal - LYHU Automation
chcp 65001 > nul
cd /d "G:\LYHU\Projects\LYHU-app"
echo --- DEBUG INFO ---
echo Script: "G:\LYHU\Projects\LYHU-app\scripts\marketing\execute_profile_add.js"
echo Args: "{url:https://www.facebook.com/ha.luong.hang.han,limit:40,speed:slow,action:auto_add}"
echo Profile: ".bot_profile"
echo CMD Line: node "G:\LYHU\Projects\LYHU-app\scripts\marketing\execute_profile_add.js" "{url:https://www.facebook.com/ha.luong.hang.han,limit:40,speed:slow,action:auto_add}" --profile=".bot_profile"
echo --- END DEBUG ---
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\execute_profile_add.js" "{url:https://www.facebook.com/ha.luong.hang.han,limit:40,speed:slow,action:auto_add}" --profile=".bot_profile"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul