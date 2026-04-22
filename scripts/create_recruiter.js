require('dotenv').config({ path: __dirname + '/../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'tuyendung@lyhu.vn';
    const password = 'LyhuPassword123!';
    const role = 'recruiter';

    console.log(`Creating user ${email}...`);
    
    let userId;
    
    // Try admin create first
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
         const { data, error } = await supabase.auth.admin.createUser({
             email,
             password,
             email_confirm: true
         });
         if (error) {
             console.log("Error creating user:", error.message);
             if (error.message.includes("already")) {
                const {data: ud} = await supabase.from('profiles').select('id').eq('email', email).single();
                if(ud) userId = ud.id;
             } else return;
         } else {
             userId = data.user.id;
         }
    } else {
         const { data, error } = await supabase.auth.signUp({
             email,
             password
         });
         if (error) {
             console.log("Error creating user:", error.message);
             if (error.message.includes("already")) {
                const {data: ud} = await supabase.from('profiles').select('id').eq('email', email).single();
                if(ud) userId = ud.id;
             } else return;
         } else {
             userId = data.user.id;
         }
    }

    if (userId) {
         console.log(`Updating role to ${role}...`);
         const { error: updateError } = await supabase
             .from('profiles')
             .update({ role: role })
             .eq('id', userId);
             
         if (updateError) {
             console.log("Error updating role:", updateError.message);
             // fallback to signIn and update if using anon key
             const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                 email,
                 password
             });
             if (!signInError) {
                 await supabase.from('profiles').update({ role: role }).eq('id', userId);
                 console.log("SUCCESS via fallback!");
             }
         } else {
             console.log("SUCCESS! Account created.");
         }
    }
}
run();
