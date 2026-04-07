const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    console.log("Starting revert...");
    // 1. Get exact commit ID of HEAD~3
    const commitId = execFileSync('git', ['rev-parse', 'HEAD~3']).toString().trim();
    console.log("Reverting to: " + commitId);

    // 2. Checkout the entire src/app/(dashboard)/culture directory to that commit
    execFileSync('git', ['checkout', commitId, '--', 'src/app/(dashboard)/culture']);
    console.log("Restored culture directory");

    // 3. Remove new files
    const newFiles = [
        'src/components/culture/CultureMain.tsx',
        'src/components/culture/CultureSidebar.tsx',
        'src/components/culture/CultureProvider.tsx',
        'src/components/culture/BlockRenderer.tsx',
        'src/components/culture/DefaultData.ts'
    ];
    for (const file of newFiles) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log("Deleted " + file);
        }
    }

    // 4. Uninstall packages
    console.log("Uninstalling DND...");
    execFileSync('npm', ['uninstall', '@hello-pangea/dnd', 'lucide-react'], { stdio: 'inherit', shell: true });

    // 5. Restore layout.tsx and tailwind.config.ts from HEAD~3
    execFileSync('git', ['checkout', commitId, '--', 'src/app/layout.tsx', 'tailwind.config.ts']);
    
    // 6. Commit the revert
    execFileSync('git', ['add', '.']);
    // execFileSync('git', ['commit', '-m', '"revert: undo CMS and Be Vietnam Pro font"']); - skip commit so user can see it in VS Code as modified

    console.log("ALL RESTORED PERFECTLY!");
} catch (e) {
    console.error("ERROR:", e);
}
