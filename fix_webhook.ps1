$file = "g:\LYHU\Projects\LYHU-app\src\app\api\facebook\webhook\route.ts"
$lines = Get-Content $file
$out = @()
$skip = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($skip -gt 0) { $skip--; continue }
    if ($lines[$i] -match 'Auto-detect Vietnamese phone numbers from customer messages') {
        $out += '                            // Auto-detect Vietnamese phone numbers (uses same robust regex as AI)'
        $out += '                            const detectedPhone = extractPhoneNumber(text);'
        $out += '                            if (detectedPhone) {'
        $out += '                                upsertData.customer_phone = detectedPhone;'
        $out += '                            }'
        $skip = 7
    } else {
        $out += $lines[$i]
    }
}
$out | Set-Content $file -Encoding UTF8
Write-Host "DONE - replaced phone detection"
