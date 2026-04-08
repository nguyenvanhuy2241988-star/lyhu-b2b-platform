const fs = require('fs');
let content = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Insert the new route into ROLES.MARKETING array
content = content.replace(
    '    [ROLES.MARKETING]: [\r\n        { label: "Tổng quan Marketing", href: "/marketing", icon: LayoutDashboard },',
    '    [ROLES.MARKETING]: [\r\n        { label: "Tổng quan Marketing", href: "/marketing", icon: LayoutDashboard },\r\n        { label: "Tr.tâm BOT Tự động", href: "/marketing/bot-center", icon: Bot },'
);

// Fallback if \r\n wasn't used
content = content.replace(
    '    [ROLES.MARKETING]: [\n        { label: "Tổng quan Marketing", href: "/marketing", icon: LayoutDashboard },',
    '    [ROLES.MARKETING]: [\n        { label: "Tổng quan Marketing", href: "/marketing", icon: LayoutDashboard },\n        { label: "Tr.tâm BOT Tự động", href: "/marketing/bot-center", icon: Bot },'
);

fs.writeFileSync('src/lib/constants.ts', content);
console.log("constants.ts updated!");
