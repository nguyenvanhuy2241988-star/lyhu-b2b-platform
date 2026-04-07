const fs = require('fs');

const srcFiles = fs.readdirSync(__dirname);
const pdfFiles = srcFiles.filter(f => f.toLowerCase().endsWith('.pdf'));

console.log("Found PDF files:", pdfFiles);
