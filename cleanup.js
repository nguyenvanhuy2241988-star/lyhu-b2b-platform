const fs = require('fs');

try {
    fs.rmSync('src/components/culture', { recursive: true, force: true });
    console.log("Deleted src/components/culture");
} catch (e) {
    console.log("Error or already deleted", e.message);
}
