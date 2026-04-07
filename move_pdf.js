const fs = require('fs');
const path = require('path');

const srcFiles = fs.readdirSync(__dirname);
const pdfFile = 'VĂN HÓA DOANH NGHIỆP LYHU ( Final ).pdf';

if (srcFiles.includes(pdfFile)) {
    const srcPath = path.join(__dirname, pdfFile);
    const destDir = path.join(__dirname, 'public', 'documents');
    const destPath = path.join(destDir, 'culture.pdf');
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.renameSync(srcPath, destPath);
    console.log('Moved', pdfFile, 'to', destPath);
} else {
    console.log('PDF file not found in', __dirname);
}
