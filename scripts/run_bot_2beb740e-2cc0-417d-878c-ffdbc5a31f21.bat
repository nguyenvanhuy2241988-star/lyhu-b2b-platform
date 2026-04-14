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
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js" "https://www.facebook.com/groups/6957616160942647/,https://www.facebook.com/groups/1637373916492855,https://www.facebook.com/groups/1903871609629493/,https://www.facebook.com/groups/2899064393708328/,https://www.facebook.com/groups/789315524541441/?__cft__[0]=AZaaRQO8YRQoqtXyU_j6oY9Zz76XrOW0qf9MJutze-UlZXkKm82nHcZjXvLOfN05DoxOrwxxBiFRQ8SJM9jVOYQNao3kpGwdZDfDwEQ5_JV9BRdns_zJiTZ3mpHpAMpkx1QC_I-A0LKikRBypSRQzpA5c5uYoXKUpAry35tdS1yTNg__tn__=-UC2CP-R" --profile=".bot_profile_lanlyhu"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul