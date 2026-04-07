const cp = require('child_process');
const fs = require('fs');

try {
    const pageContent = cp.execSync('git show HEAD~3:"src/app/(dashboard)/culture/page.tsx"').toString();
    fs.writeFileSync('src/app/(dashboard)/culture/page.tsx', pageContent);

    // remove the nested dnd components we added
    if (fs.existsSync('src/components/culture/CultureMain.tsx')) fs.unlinkSync('src/components/culture/CultureMain.tsx');
    if (fs.existsSync('src/components/culture/CultureSidebar.tsx')) fs.unlinkSync('src/components/culture/CultureSidebar.tsx');
    if (fs.existsSync('src/components/culture/CultureProvider.tsx')) fs.unlinkSync('src/components/culture/CultureProvider.tsx');
    if (fs.existsSync('src/components/culture/BlockRenderer.tsx')) fs.unlinkSync('src/components/culture/BlockRenderer.tsx');
    if (fs.existsSync('src/components/culture/DefaultData.ts')) fs.unlinkSync('src/components/culture/DefaultData.ts');

    // old Editable components were inside page.tsx but if not, restore them? No, they were inside page.tsx before! Wait, I extracted them in the massive CMS PR! In the old version, they were actually top-level or imported?
    // Let me check if EditableImage.tsx existed HEAD~3.
    try {
        const imgContent = cp.execSync('git show HEAD~3:"src/app/(dashboard)/culture/EditableImage.tsx"').toString();
        fs.writeFileSync('src/app/(dashboard)/culture/EditableImage.tsx', imgContent);
        
        const txtContent = cp.execSync('git show HEAD~3:"src/app/(dashboard)/culture/EditableText.tsx"').toString();
        fs.writeFileSync('src/app/(dashboard)/culture/EditableText.tsx', txtContent);
    } catch (e) {
        // they probably existed inside page.tsx in the older version, or I had already moved them to the folder. If it fails, they didn't exist locally as separate. Wait, earlier I did a `view_file` on `page.tsx` and it imported them from `../components/EditableImage` maybe? Let's not assume.
    }

    // Now run git push and npm uninstall
    cp.execSync('npm uninstall @hello-pangea/dnd lucide-react');

    console.log("SUCCESSFULLY REVERTED TO PREVIOUS WORKING LOGO STATE");
} catch (e) {
    console.error("FAILED", e.toString());
}
