import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { scriptName } = await req.json();

        // Whitelist allowed scripts for security
        const ALLOWED_SCRIPTS = [
            'execute_search_add.js',
            'group_finder.js',
            'invite_friend_page.js',
            'defense_engine.js'
        ];

        if (!ALLOWED_SCRIPTS.includes(scriptName)) {
            return NextResponse.json({ error: 'Invalid script name' }, { status: 400 });
        }

        const scriptPath = path.join(process.cwd(), 'scripts', 'marketing', scriptName);

        // Execute the script
        // Note: We use 'start' on Windows to open a new terminal window so the user can see the bot running.
        // For 'defense_engine.js', capturing output might be better, but for Puppeteer scripts with 'headless: false',
        // seeing the valid browser window + terminal logs is best.

        let command = `start cmd /k "node ${scriptPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
        });

        return NextResponse.json({ success: true, message: `Launched ${scriptName} in new terminal` });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
