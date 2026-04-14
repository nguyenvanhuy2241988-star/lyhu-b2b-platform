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
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js" "https://www.facebook.com/groups/1488336168403706/?__cft__[0]=AZaLFptRW2ERpx_cg2J6RHFZBSK4E31I38G4exT9KfLzqE5ivPvM91a87CnjZTRu1pbKjqknS43PY0VJLhKep5tH4ajY9VXAvoAFVwtlCCur1_O6y2GDugDNzVepJoSy4Xpbrfo3-Uc33y3Q0C8VvhS_jxvfj4XOfgdbmYqmgPFAwg__tn__=-UC2CP-R,http://facebook.com/groups/829399272479157/,https://www.facebook.com/share/g/18ACCdn93K/,https://www.facebook.com/share/p/18SpdZiY2a/,https://www.facebook.com/groups/1174211873424422/?__cft__[0]=AZZVVz4zmtQtJXQmIB2yWs3Ii8gfiS3X8RhYeTMZOEVqdenlb3D8z7K8PVhWbGuHXxWYyBnyxvthl3oGktdfaBQ-PtU87EueKEzaP9Rr_s4mmAuKpcw1hSeu-vNxmrSvSJIDUWhaOan0EumcyWxFWEak2HYm2CFkRUcPf7bWmr9dng__tn__=-UC2CP-R" --profile=".bot_profile_lanlyhu"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul