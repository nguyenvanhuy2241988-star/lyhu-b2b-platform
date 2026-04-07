const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('public/documents/culture.pdf');

pdf(dataBuffer).then(function(data) {
    // Write just the first 3000 characters to a file so we can read it and get an idea of the table of contents
    fs.writeFileSync('pdf_preview.txt', data.text.substring(0, 3000));
    console.log("Extracted PDF text to pdf_preview.txt");
}).catch(function(err) {
    console.log("Error parsing PDF:", err);
});
