const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

console.log("pdf exported as:", typeof pdf);

const pdfPath = path.join(__dirname, 'public', 'documents', 'culture.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

const parse = typeof pdf === 'function' ? pdf : pdf.default;

parse(dataBuffer).then(function(data) {
    fs.writeFileSync(path.join(__dirname, 'pdf_content.txt'), data.text);
    console.log("PDF parsed successfully. Total characters:", data.text.length);
}).catch(function(err) {
    console.log("Error parsing PDF:", err);
});
