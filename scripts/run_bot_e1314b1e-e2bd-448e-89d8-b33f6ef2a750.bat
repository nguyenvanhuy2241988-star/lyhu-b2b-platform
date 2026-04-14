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
node "G:\LYHU\Projects\LYHU-app\scripts\marketing\group_finder.js" "https://www.facebook.com/share/g/16zA9QyWdT/,https://www.facebook.com/groups/565223200302087/?__cft__[0]=AZZhay60CVvnaDo-WXwXEQFMpaXF3FoU-ZBjQ86hhvwjNoJSz793fbUi_wLaZEg5jd-XW-tEGIRvTxuoUePV_SVYdAIOaKYMt_fq046NQA1qxi2Ov6UbWK4k4JnDzz2vhQWSX34_HuhjVfA2VW2ekSyG0PIpK8O4EMhiJX_JftSOrQ__tn__=-UC2CP-R,https://www.facebook.com/groups/1056507228147057/?__cft__[0]=AZZxhetKebKaQpwOiBGl1oC5KALBvwI9N2LKg4azoQoBGYj8vXxAouy2WghLekZz5sdJlwEM2vxY5a-NZ1oPqrHRydI44_MKx7zLCRRe8qMiPOekM4NGpzCoTsxayHNlTSkrLZhNgCC4M9MpJlAYrZRnIoukcOB5ZBbe-ixjkiT1LQ__tn__=-UC2CP-R,https://www.facebook.com/groups/645681148949147/,https://www.facebook.com/groups/1826654597649460/?__cft__[0]=AZaYrzJiBdFaA2BavLajPaLArp6FNCPa3l1AbvvzyvtcxCpXgWZbrkhtrekt3gdvUHVggvRXPbXFyuehcJs8g_3rYPuA49HMAKJI2DTAfIayKscoXmh3fIxZnZ78KITkoX5ozYDs_ARWrpt0GubTIRdhFpvgY2YFftkh57KzRKkY3g__tn__=-UC2CP-R" --profile=".bot_profile_lanlyhu"
echo.
echo HOAN THANH - CUA SO SE TU DONG TONG SAU 30 GIAY
timeout /t 30 >nul