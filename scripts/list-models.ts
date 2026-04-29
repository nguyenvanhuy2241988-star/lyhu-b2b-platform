import 'dotenv/config';

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No GEMINI_API_KEY found");
        return;
    }
    
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        if (data.models) {
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(m.name);
                }
            });
        } else {
            console.log(data);
        }
    } catch(e) {
        console.error(e);
    }
}

listModels();
