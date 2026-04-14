@echo off
title BotTerminal - LYHU Automation
chcp 65001 > nul
cd /d "G:\LYHU\Projects\LYHU-app"
echo --- DEBUG INFO ---
echo Script: "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_group.js"
echo Args: "https://www.facebook.com/groups/756449994894650,https://www.facebook.com/groups/2177891362547512/,https://www.facebook.com/groups/136250529862253,https://www.facebook.com/groups/1177056912723830?locale=vi_VN,https://www.facebook.com/groups/salethainguyen |  CVT  |  5  |  360"
echo Profile: ".bot_profile_lanlyhu"
echo CMD Line: node "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_group.js" "https://www.facebook.com/groups/756449994894650,https://www.facebook.com/groups/2177891362547512/,https://www.facebook.com/groups/136250529862253,https://www.facebook.com/groups/1177056912723830?locale=vi_VN,https://www.facebook.com/groups/salethainguyen |  CVT  |  5  |  360" --profile=".bot_profile_lanlyhu"
echo --- END DEBUG ---
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\auto_post_group.js" "https://www.facebook.com/groups/756449994894650,https://www.facebook.com/groups/2177891362547512/,https://www.facebook.com/groups/136250529862253,https://www.facebook.com/groups/1177056912723830?locale=vi_VN,https://www.facebook.com/groups/salethainguyen |  CVT  |  5  |  360" --profile=".bot_profile_lanlyhu"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul