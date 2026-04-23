const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding demo blog posts...");

    // Categories
    const categories = [
        { name: 'Kinh nghiệm Mở Quán', slug: 'kinh-nghiem-mo-quan', sort_order: 1 },
        { name: 'Nguồn hàng sỉ', slug: 'nguon-hang-si', sort_order: 2 },
        { name: 'Xu hướng Ăn vặt', slug: 'xu-huong-an-vat', sort_order: 3 },
    ];

    const insertedCats = [];
    for (const cat of categories) {
        const { data, error } = await supabase.from('blog_categories').upsert(cat, { onConflict: 'slug' }).select().single();
        if (error) console.error("Error inserting category:", error);
        if (data) insertedCats.push(data);
    }

    if (insertedCats.length === 0) return console.log("No categories inserted.");

    // Posts
    const posts = [
        {
            title: 'Kinh Nghiệm Mở Siêu Thị Mini Ở Vùng Quê Vốn Nhỏ Lãi Cao',
            slug: 'kinh-nghiem-mo-sieu-thi-mini-vung-que',
            category_id: insertedCats[0].id,
            content: '<h2>Mở siêu thị mini ở quê có tiềm năng không?</h2><p>Ở các vùng nông thôn hiện nay, đời sống người dân đang ngày càng nâng cao. Nhu cầu mua sắm tại các cửa hàng tạp hóa hiện đại, siêu thị mini sáng sủa sạch sẽ đang tăng mạnh...</p><p>Bài viết này hướng dẫn chi tiết cách chọn mặt bằng, nhập hàng và quản lý doanh thu hiệu quả.</p>',
            ai_summary: 'Hướng dẫn chi tiết từ A-Z cách setup một siêu thị mini ở vùng nông thôn, từ việc chọn địa điểm đến quản lý nguồn vốn.',
            thumbnail_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1600&auto=format&fit=crop',
            status: 'published',
            published_at: new Date().toISOString()
        },
        {
            title: 'Top 5 Mặt Hàng Kẹo Dẻo Thái Lan Hot Nhất Giới Trẻ',
            slug: 'top-5-mat-hang-keo-deo-thai-lan',
            category_id: insertedCats[2].id,
            content: '<h2>Kẹo dẻo siêu chua Thái Lan đang lên ngôi</h2><p>Thời gian gần đây, kẹo dẻo chua Thái Lan đang gây sốt rần rần trên TikTok. Các tạp hóa và siêu thị mini nếu không cập nhật sớm sẽ mất đi lượng lớn khách hàng trẻ em và học sinh...</p>',
            ai_summary: 'Tổng hợp 5 loại kẹo dẻo Thái Lan nhập sỉ bán chạy nhất, giúp chủ tạp hóa tăng mạnh doanh thu mảng bánh kẹo nhập khẩu.',
            thumbnail_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=1600&auto=format&fit=crop',
            status: 'published',
            published_at: new Date().toISOString()
        },
        {
            title: 'Cách Tìm Nguồn Hàng Bánh Tráng Giá Sỉ Tận Xưởng',
            slug: 'cach-tim-nguon-hang-banh-trang-gia-si',
            category_id: insertedCats[1].id,
            content: '<h2>Tại sao nên bán bánh tráng?</h2><p>Bánh tráng trộn, bánh tráng nướng là món ăn vặt quốc dân. Nhập sỉ bánh tráng tận xưởng giúp bạn có biên độ lợi nhuận lên đến 40%...</p>',
            ai_summary: 'Kinh nghiệm đàm phán và tìm nguồn sỉ bánh tráng trực tiếp từ xưởng Tây Ninh, tránh qua trung gian.',
            thumbnail_url: 'https://images.unsplash.com/photo-1606112219348-204d7d8b94ee?q=80&w=1600&auto=format&fit=crop',
            status: 'published',
            published_at: new Date().toISOString()
        },
        {
            title: 'Bí Quyết Bày Trí Cửa Hàng Tạp Hóa Thu Hút Khách',
            slug: 'bi-quyet-bay-tri-cua-hang-tap-hoa',
            category_id: insertedCats[0].id,
            content: '<h2>Nguyên tắc trưng bày hàng hóa</h2><p>Một cửa hàng sạch sẽ, gọn gàng với cách bày trí logic sẽ kích thích khách hàng mua thêm những món đồ họ không định mua từ trước. Quy tắc cơ bản là: Hàng thiết yếu để phía trong, hàng ăn vặt và đồ chơi để phía ngoài, vừa tầm mắt trẻ em...</p>',
            ai_summary: 'Áp dụng tâm lý học hành vi vào việc sắp xếp quầy kệ tạp hóa để tăng giá trị đơn hàng trung bình của khách.',
            thumbnail_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop',
            status: 'published',
            published_at: new Date().toISOString()
        },
        {
            title: 'Cảnh Báo: Các Loại Bim Bim Nhái Thương Hiệu Đang Tràn Lan',
            slug: 'canh-bao-bim-bim-nhai-thuong-hieu',
            category_id: insertedCats[2].id,
            content: '<h2>Hàng giả hàng nhái gây mất uy tín</h2><p>Nhiều chủ tạp hóa vì ham rẻ mà nhập phải các lô bim bim, snack không rõ nguồn gốc. Điều này không chỉ vi phạm pháp luật mà còn ảnh hưởng trực tiếp đến sức khỏe trẻ nhỏ và uy tín của quán...</p>',
            ai_summary: 'Cách phân biệt snack chính hãng và hàng nhái, bảo vệ sức khỏe người tiêu dùng và uy tín cửa hàng của bạn.',
            thumbnail_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=1600&auto=format&fit=crop',
            status: 'published',
            published_at: new Date().toISOString()
        }
    ];

    for (const post of posts) {
        const { error } = await supabase.from('blog_posts').upsert(post, { onConflict: 'slug' });
        if (error) console.error("Error inserting post:", error);
        else console.log(`Inserted post: ${post.title}`);
    }
    
    console.log("Seeding complete.");
}

seed();
