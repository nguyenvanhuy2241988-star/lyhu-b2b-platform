const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Querying folders...');
    const { data: allFolders, error } = await supabase
        .from('documents_folders')
        .select('id, name, parent_id, order_index, is_deleted')
        .is('is_deleted', false);

    if (error) {
        console.error('Error:', error);
        return;
    }

    // Find Cong ty and Ke toan
    const targets = allFolders.filter(f => f.name === 'Công ty' || f.name === 'Kế Toán' || f.name === 'Kế toán');
    console.log('Found Targets:');
    console.log(JSON.stringify(targets, null, 2));

    // Fix circular references or bad parent_ids
    for (const f of targets) {
        if (f.name === 'Công ty' && f.parent_id !== null) {
            console.log('Fixing Cong ty to be a root folder...');
            await supabase.from('documents_folders').update({ parent_id: null, order_index: 0 }).eq('id', f.id);
        }
        if (f.name === 'Kế Toán' || f.name === 'Kế toán') {
            console.log('Fixing Ke Toan...');
            const root = allFolders.find(x => x.name === 'Công ty');
            if (root) {
                await supabase.from('documents_folders').update({ parent_id: root.id, order_index: 10 }).eq('id', f.id);
            }
        }
    }
    console.log('Done.');
}

run();
