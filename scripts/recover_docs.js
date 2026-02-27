const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Bắt đầu phục hồi dữ liệu từ Storage...");

    // 1. Lấy admin user đầu tiên để gán quyền (fallback)
    const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
    if (userErr || !users.users || users.users.length === 0) {
        console.error("Không lấy được danh sách user, lỗi:", userErr);
        return;
    }
    const adminUid = users.users[0].id;
    console.log("Dùng Admin UID:", adminUid);

    // 2. Lấy ID của thư mục "Công ty" để chứa tất cả các file phục hồi
    let { data: folders, error: fErr } = await supabase
        .from('documents_folders')
        .select('id')
        .eq('name', 'Công ty')
        .eq('is_deleted', false)
        .limit(1);

    if (fErr || !folders || folders.length === 0) {
        console.log("Không tìm thấy thư mục 'Công ty', tạo mới...");
        const { data: newF, error: nfErr } = await supabase.from('documents_folders').insert({
            name: 'Công ty',
            created_by: adminUid
        }).select().single();
        if (nfErr) {
            console.error("Lỗi tạo thư mục gốc:", nfErr);
            return;
        }
        folders = [newF];
    }
    const defaultFolderId = folders[0].id;
    console.log("All file sẽ được đưa vào thư mục ID:", defaultFolderId);

    // 3. Quét storage
    const { data: globalFolders, error: lsErr } = await supabase.storage.from('lyhu-docs').list('global');
    if (lsErr) {
        console.error("Lỗi list bucket lyhu-docs:", lsErr);
        return;
    }

    if (!globalFolders || globalFolders.length === 0) {
        console.log("Không có dữ liệu trong bucket global/");
        return;
    }

    let recoveredCount = 0;

    for (const oldFolder of globalFolders) {
        const folderName = oldFolder.name;
        if (folderName === '.emptyFolderPlaceholder') continue;

        console.log(`Đang quét thu mục cũ: global/${folderName}...`);

        const { data: files, error: filesErr } = await supabase.storage.from('lyhu-docs').list(`global/${folderName}`);
        if (filesErr || !files) {
            console.error(`Lỗi đọc file của ${folderName}:`, filesErr);
            continue;
        }

        for (const fileItem of files) {
            // Check file attributes
            if (!fileItem.id && fileItem.name === '.emptyFolderPlaceholder') continue;

            const storagePath = `global/${folderName}/${fileItem.name}`;

            // Xử lý extract original file name từ chuỗi
            // Cấu trúc cũ Date.now()-uuid-OriginalName
            // Ví dụ: 1708892900000-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-Bao-cao.pdf
            const fileNamePattern = /^\d+-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
            const match = fileItem.name.match(fileNamePattern);

            let originalName = fileItem.name;
            if (match && match[1]) {
                originalName = match[1];
            }

            // Estimate Mime Type thủ công do Database bị thiếu
            let mimeType = 'application/octet-stream';
            const ext = originalName.split('.').pop()?.toLowerCase();
            if (ext) {
                if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) mimeType = `image/${ext}`;
                else if (ext === 'pdf') mimeType = 'application/pdf';
                else if (['doc', 'docx'].includes(ext)) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                else if (['xls', 'xlsx'].includes(ext)) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }

            // check duplicate
            const { data: existing } = await supabase
                .from('documents_files')
                .select('id')
                .eq('storage_path', storagePath)
                .single();

            if (existing) {
                console.log(` -> File đã tồn tại trong DB, bỏ qua: ${originalName}`);
                continue;
            }

            // Insert DB
            const { error: insertErr } = await supabase.from('documents_files').insert({
                folder_id: defaultFolderId,
                title: originalName,
                original_name: originalName,
                mime_type: mimeType,
                size_bytes: fileItem.metadata ? fileItem.metadata.size : 0,
                storage_bucket: 'lyhu-docs',
                storage_path: storagePath,
                created_by: adminUid
            });

            if (insertErr) {
                console.error(` -> Lỗi insert DB file ${originalName}:`, insertErr);
            } else {
                console.log(` -> Đã phục hồi: ${originalName}`);
                recoveredCount++;
            }
        }
    }

    console.log(`\n🎉 HOÀN THÀNH! Đã phục hồi thành công ${recoveredCount} file vào thư mục "Công ty".`);
}

run();
