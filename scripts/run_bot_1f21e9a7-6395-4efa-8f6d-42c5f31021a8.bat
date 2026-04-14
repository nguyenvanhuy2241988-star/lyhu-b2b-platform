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
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js" "http://facebook.com/groups/829399272479157/,https://www.facebook.com/groups/929701375877229/,https://www.facebook.com/share/g/1CWoXjAZFV/,https://www.facebook.com/groups/789315524541441/?__cft__[0]=AZaaRQO8YRQoqtXyU_j6oY9Zz76XrOW0qf9MJutze-UlZXkKm82nHcZjXvLOfN05DoxOrwxxBiFRQ8SJM9jVOYQNao3kpGwdZDfDwEQ5_JV9BRdns_zJiTZ3mpHpAMpkx1QC_I-A0LKikRBypSRQzpA5c5uYoXKUpAry35tdS1yTNg__tn__=-UC2CP-R,https://www.facebook.com/groups/1054573446059422/?__cft__[0]=AZZbik_86rWnkTfjYAfDrjpC158YMuw8HPKVGkRj1mqv6Y5QiyBTzbvN0aWhgyhhwGmXnjw-aEr4OXPBKrTPhNpR_bH9AScGy1WXMucRWXoYoC-dvM_3a_3V9O8P9n4v63EJUcs0xdoopr63xX9KIsFBSk-35IwvY4Skc1gF2L0bqw__tn__=-UC2CP-R" --profile=".bot_profile_lanlyhu"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul