const https = require('https');
const fs = require('fs');

const url = "https://raw.githubusercontent.com/nguyenvanhuy2241988-star/lyhu-b2b-platform/57daff08cbe8d6156ff8f28a94b35383b356cff2/src/app/(dashboard)/culture/page.tsx";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('src/app/(dashboard)/culture/page.tsx', data);
        console.log("Successfully restored page.tsx from GitHub!");
    });
}).on('error', (err) => {
    console.error(err);
});
