#!/usr/bin/env node
/**
 * LYHU Meta Ads Manager - MCP Server for Claude Desktop
 * Provides Claude with autonomous tools to create, inspect, and optimize Facebook Ads.
 */

const readline = require('readline');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Logging helper - strictly to stderr so stdout remains pure JSON-RPC
function log(...args) {
    console.error('[LYHU-Ads-MCP]', ...args);
}

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
let ENV = {};
if (fs.existsSync(envPath)) {
    const rawEnv = fs.readFileSync(envPath, 'utf8');
    rawEnv.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = (match[2] || '').trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            ENV[match[1]] = value;
        }
    });
}

const DEFAULT_AD_ACCOUNT_ID = ENV.FB_AD_ACCOUNT_ID || 'act_2776071776027324';
const DEFAULT_PAGE_ID = '555292447265214'; // LYHU Fanpage

function getAccessToken() {
    return ENV.FB_ADS_ACCESS_TOKEN || ENV.FB_APP_TOKEN || '';
}

function saveAccessToken(token) {
    ENV.FB_ADS_ACCESS_TOKEN = token;
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (content.includes('FB_ADS_ACCESS_TOKEN=')) {
        content = content.replace(/FB_ADS_ACCESS_TOKEN=.*/g, `FB_ADS_ACCESS_TOKEN="${token}"`);
    } else {
        content += `\nFB_ADS_ACCESS_TOKEN="${token}"\n`;
    }
    if (!content.includes('FB_AD_ACCOUNT_ID=')) {
        content += `FB_AD_ACCOUNT_ID="act_2776071776027324"\n`;
    }
    fs.writeFileSync(envPath, content, 'utf8');
}

// Supabase configuration & helper for LYHU App database
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supabaseQuery(endpoint) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_KEY trong .env.local');
    }
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const res = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase query error (${res.status}): ${text}`);
    }
    return await res.json();
}

// Helper: HTTP request
function fbApi(endpoint, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const accessToken = token || getAccessToken();
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `https://graph.facebook.com/v19.0/${endpoint}${separator}access_token=${accessToken}`;
        const parsed = new URL(url);

        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.error) {
                        reject(new Error(parsedData.error.message || JSON.stringify(parsedData.error)));
                    } else {
                        resolve(parsedData);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        if (body && (method === 'POST' || method === 'PUT')) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Tool definitions for Claude
const TOOLS = [
    {
        name: 'fb_get_ad_account_insights',
        description: 'Lấy danh sách các chiến dịch, nhóm quảng cáo (AdSets), chi phí chi tiêu (Spend), lượt hiển thị (Impressions), lượt click, và kết quả từ tài khoản quảng cáo Facebook LYHU (act_2776071776027324). Dùng công cụ này để đo lường và kiểm tra hiệu quả quảng cáo.',
        inputSchema: {
            type: 'object',
            properties: {
                time_range: {
                    type: 'string',
                    description: 'Khoảng thời gian: today, yesterday, last_7d, last_30d, maximum',
                    default: 'last_7d'
                },
                status_filter: {
                    type: 'string',
                    description: 'Bộ lọc trạng thái: ALL, ACTIVE, PAUSED',
                    default: 'ALL'
                }
            }
        }
    },
    {
        name: 'fb_create_ad_campaign',
        description: 'Tự động tạo chiến dịch quảng cáo mới kèm nhóm quảng cáo và bài viết quảng cáo vào tài khoản LYHU (act_2776071776027324). Chiến dịch sẽ xuất hiện trực tiếp trong Trình quản lý quảng cáo của Facebook.',
        inputSchema: {
            type: 'object',
            required: ['campaign_name', 'ad_headline', 'ad_message'],
            properties: {
                campaign_name: {
                    type: 'string',
                    description: 'Tên chiến dịch, ví dụ: [22/10] Tìm Khách Sỉ Khoai Môn CVT'
                },
                daily_budget_vnd: {
                    type: 'number',
                    description: 'Ngân sách hàng ngày tính bằng VNĐ (tối thiểu 50.000, mặc định 100.000)',
                    default: 100000
                },
                objective: {
                    type: 'string',
                    description: 'Mục tiêu: OUTCOME_ENGAGEMENT (tương tác/nhắn tin - khuyên dùng), OUTCOME_TRAFFIC, OUTCOME_LEADS',
                    default: 'OUTCOME_ENGAGEMENT'
                },
                ad_headline: {
                    type: 'string',
                    description: 'Tiêu đề ngắn nổi bật ở chân bài ads (Call-to-Action headline)'
                },
                ad_message: {
                    type: 'string',
                    description: 'Toàn bộ nội dung bài viết quảng cáo (do Claude soạn thảo)'
                },
                image_url: {
                    type: 'string',
                    description: 'Link ảnh sản phẩm HD (mặc định lấy ảnh Khoai Môn CVT từ hệ thống nếu để trống)'
                },
                status: {
                    type: 'string',
                    description: 'Trạng thái ban đầu: PAUSED (Tạo nháp để duyệt trước - khuyên dùng an toàn) hoặc ACTIVE (chạy ngay)',
                    default: 'PAUSED'
                }
            }
        }
    },
    {
        name: 'fb_optimize_adset',
        description: 'Điều chỉnh bật/tắt (PAUSE/RESUME) hoặc thay đổi ngân sách hàng ngày (SCALE UP) cho một nhóm quảng cáo cụ thể dựa trên hiệu quả đo lường.',
        inputSchema: {
            type: 'object',
            required: ['adset_id', 'action'],
            properties: {
                adset_id: {
                    type: 'string',
                    description: 'ID của nhóm quảng cáo (AdSet ID), ví dụ: 120210...'
                },
                action: {
                    type: 'string',
                    enum: ['PAUSE', 'RESUME', 'SCALE_UP_20', 'SET_BUDGET'],
                    description: 'Hành động: PAUSE (Tắt quảng cáo), RESUME (Bật lại), SCALE_UP_20 (Tăng 20% ngân sách), SET_BUDGET (Đặt ngân sách mới)'
                },
                new_budget_vnd: {
                    type: 'number',
                    description: 'Số tiền ngân sách mới (VNĐ) nếu chọn hành động SET_BUDGET'
                }
            }
        }
    },
    {
        name: 'fb_check_or_update_token',
        description: 'Kiểm tra trạng thái kết nối Facebook Ads Token, hoặc cập nhật mã Token mới vào hệ thống.',
        inputSchema: {
            type: 'object',
            properties: {
                new_access_token: {
                    type: 'string',
                    description: 'Mã Access Token mới của Facebook nếu muốn cập nhật'
                }
            }
        }
    },
    {
        name: 'lyhu_get_customer_lifecycle_funnel',
        description: 'Lấy dữ liệu phân tích vòng đời khách hàng từ cơ sở dữ liệu LYHU App cho các bài quảng cáo (tổng số inbox, số khách để lại SĐT, phân loại khách Bán sỉ / Đại lý / NPP / Bán lẻ, và danh sách sản phẩm khách quan tâm). Dùng công cụ này để đo lường CHẤT LƯỢNG TỆP B2B thực tế của từng bài ads thay vì chỉ nhìn số liệu thô của Facebook.',
        inputSchema: {
            type: 'object',
            properties: {
                ad_id: {
                    type: 'string',
                    description: 'Mã bài quảng cáo (Ad ID) cụ thể cần lọc, ví dụ: 120237755410310060. Nếu để trống sẽ lấy báo cáo tổng hợp tất cả các bài quảng cáo.'
                },
                days: {
                    type: 'number',
                    description: 'Số ngày gần nhất cần phân tích (mặc định 30 ngày)',
                    default: 30
                }
            }
        }
    },
    {
        name: 'lyhu_get_customer_conversations',
        description: 'Đọc nội dung tin nhắn và câu hỏi thực tế của khách hàng từ một bài quảng cáo cụ thể. Giúp Claude đọc thấu hiểu insight khách hàng (khách hỏi giá sỉ bao nhiêu, chính sách vận chuyển, hỏi sản phẩm nào, lý do từ chối hoặc chốt đơn) để đưa ra đề xuất tối ưu nội dung và kịch bản quảng cáo.',
        inputSchema: {
            type: 'object',
            required: ['ad_id'],
            properties: {
                ad_id: {
                    type: 'string',
                    description: 'Mã bài quảng cáo (Ad ID), ví dụ: 120237755410310060'
                },
                limit: {
                    type: 'number',
                    description: 'Số lượng cuộc hội thoại cần đọc (mặc định 5, tối đa 20)',
                    default: 5
                }
            }
        }
    },
    {
        name: 'lyhu_get_unified_ad_roi_report',
        description: 'Báo cáo hợp nhất tối ưu hóa quảng cáo: Kết hợp trực tiếp số liệu chi phí từ Facebook Ads Manager (Spend, Impressions, Clicks, CPC) với số liệu vòng đời kinh doanh thực tế từ LYHU App (Inbox, SĐT, Khách Bán Sỉ, Tỷ lệ Lead B2B). Tự động tính toán Chi phí trên 1 Khách Sỉ (Cost per B2B Lead) và đưa ra quyết định tối ưu: SCALE UP, PAUSE, hoặc FIX CONTENT.',
        inputSchema: {
            type: 'object',
            properties: {
                time_range: {
                    type: 'string',
                    description: 'Khoảng thời gian: today, yesterday, last_7d, last_30d',
                    default: 'last_30d'
                }
            }
        }
    }
];

// Tool execution handlers
async function handleToolCall(name, args) {
    const token = getAccessToken();

    if (name === 'fb_check_or_update_token') {
        if (args.new_access_token) {
            saveAccessToken(args.new_access_token.trim());
        }
        const currentToken = getAccessToken();
        if (!currentToken) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: 'Chưa có Facebook Access Token trong hệ thống. Vui lòng cung cấp mã token hợp lệ bằng tool này để kích hoạt kết nối.'
                }]
            };
        }
        try {
            const check = await fbApi(`${DEFAULT_AD_ACCOUNT_ID}?fields=name,account_status,currency,amount_spent`, 'GET', null, currentToken);
            return {
                content: [{
                    type: 'text',
                    text: `✅ Kết nối Facebook Ads thành công!\n- Tài khoản: ${check.name} (${DEFAULT_AD_ACCOUNT_ID})\n- Tiền tệ: ${check.currency}\n- Trạng thái tài khoản: ${check.account_status === 1 ? 'HOẠT ĐỘNG BÌNH THƯỜNG' : 'CHÚ Ý (status ' + check.account_status + ')'}\n- Tổng chi tiêu tích lũy: ${Number(check.amount_spent).toLocaleString('vi-VN')} ${check.currency}`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: `❌ Token hiện tại không hợp lệ hoặc đã hết hạn: ${err.message}. Bạn cần tạo mã Token mới trên Facebook Developer / Graph API Explorer và cập nhật lại.`
                }]
            };
        }
    }

    if (!token) {
        return {
            isError: true,
            content: [{
                type: 'text',
                text: 'Chưa có Facebook Access Token. Vui lòng chạy tool fb_check_or_update_token để nạp token trước khi quản lý quảng cáo.'
            }]
        };
    }

    if (name === 'fb_get_ad_account_insights') {
        try {
            const timeRange = args.time_range || 'last_7d';
            const endpoint = `${DEFAULT_AD_ACCOUNT_ID}/adsets?fields=id,name,status,daily_budget,campaign{id,name},insights.date_preset(${timeRange}){spend,impressions,clicks,cpm,cpc,actions}&limit=50`;
            const res = await fbApi(endpoint);

            let adSets = res.data || [];
            if (args.status_filter && args.status_filter !== 'ALL') {
                adSets = adSets.filter(a => a.status === args.status_filter);
            }

            if (adSets.length === 0) {
                return {
                    content: [{
                        type: 'text',
                        text: `Không có nhóm quảng cáo nào phù hợp với bộ lọc (Trạng thái: ${args.status_filter || 'ALL'}, Thời gian: ${timeRange}).`
                    }]
                };
            }

            const formatted = adSets.map((ad, idx) => {
                const ins = (ad.insights && ad.insights.data && ad.insights.data[0]) || {};
                const spend = ins.spend ? Number(ins.spend).toLocaleString('vi-VN') + ' đ' : '0 đ';
                const impressions = ins.impressions ? Number(ins.impressions).toLocaleString('vi-VN') : '0';
                const clicks = ins.clicks || '0';
                const cpm = ins.cpm ? Math.round(Number(ins.cpm)).toLocaleString('vi-VN') + ' đ' : '-';
                const budget = ad.daily_budget ? (Number(ad.daily_budget)).toLocaleString('vi-VN') + ' đ/ngày' : 'Ngân sách chiến dịch';

                // Count messages/leads in actions
                let msgCount = 0;
                if (ins.actions) {
                    const msgAction = ins.actions.find(a => a.action_type.includes('message') || a.action_type.includes('lead'));
                    if (msgAction) msgCount = msgAction.value;
                }

                return `[#${idx + 1}] AdSet: ${ad.name} (ID: ${ad.id})\n  • Chiến dịch: ${ad.campaign ? ad.campaign.name : 'N/A'}\n  • Trạng thái: ${ad.status === 'ACTIVE' ? '🟢 ĐANG CHẠY' : '⚪ ĐANG TẮT'}\n  • Ngân sách: ${budget}\n  • Đã chi tiêu (${timeRange}): ${spend}\n  • Lượt xem: ${impressions} | Clicks: ${clicks} | CPM: ${cpm}\n  • Tin nhắn/Lead ghi nhận: ${msgCount}\n`;
            }).join('\n----------------------------------------\n');

            return {
                content: [{
                    type: 'text',
                    text: `📊 BÁO CÁO QUẢNG CÁO FACEBOOK (${timeRange.toUpperCase()}):\n\n${formatted}`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Lỗi khi tải số liệu: ${err.message}` }]
            };
        }
    }

    if (name === 'fb_create_ad_campaign') {
        try {
            const { campaign_name, daily_budget_vnd = 100000, objective = 'OUTCOME_ENGAGEMENT', ad_headline, ad_message, status = 'PAUSED' } = args;
            const imageUrl = args.image_url || 'https://wepxcpifgxghfvdgnkeh.supabase.co/storage/v1/object/public/report-images/product_img_1780056327452_8cyipg.jpg';

            // 1. Tạo Campaign
            log('Creating campaign...', campaign_name);
            const campRes = await fbApi(`${DEFAULT_AD_ACCOUNT_ID}/campaigns`, 'POST', {
                name: campaign_name,
                objective: objective,
                status: status,
                special_ad_categories: []
            });
            const campaignId = campRes.id;

            // 2. Tạo AdSet
            log('Creating adset for campaign...', campaignId);
            const adSetRes = await fbApi(`${DEFAULT_AD_ACCOUNT_ID}/adsets`, 'POST', {
                name: `${campaign_name} - Nhóm QC`,
                campaign_id: campaignId,
                billing_event: 'IMPRESSIONS',
                optimization_goal: objective === 'OUTCOME_TRAFFIC' ? 'LINK_CLICKS' : 'POST_ENGAGEMENT',
                daily_budget: Math.max(50000, daily_budget_vnd),
                bid_amount: 1000,
                targeting: {
                    geo_locations: { countries: ['VN'] },
                    age_min: 22,
                    age_max: 55
                },
                status: status
            });
            const adSetId = adSetRes.id;

            // 3. Tạo Ad Creative
            log('Creating ad creative...');
            const creativeRes = await fbApi(`${DEFAULT_AD_ACCOUNT_ID}/adcreatives`, 'POST', {
                name: `${campaign_name} - Creative`,
                object_story_spec: {
                    page_id: DEFAULT_PAGE_ID,
                    link_data: {
                        image_hash: undefined, // Or picture URL
                        picture: imageUrl,
                        link: 'https://lyhu.com.vn',
                        message: ad_message,
                        name: ad_headline,
                        call_to_action: {
                            type: 'SEND_MESSAGE'
                        }
                    }
                }
            });
            const creativeId = creativeRes.id;

            // 4. Tạo Ad
            log('Creating ad...');
            const adRes = await fbApi(`${DEFAULT_AD_ACCOUNT_ID}/ads`, 'POST', {
                name: `${campaign_name} - Bài QC`,
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: status
            });

            return {
                content: [{
                    type: 'text',
                    text: `🎉 TẠO CHIẾN DỊCH QUẢNG CÁO THÀNH CÔNG!\n\n- Tên chiến dịch: ${campaign_name}\n- Campaign ID: ${campaignId}\n- AdSet ID: ${adSetId}\n- Ad ID: ${adRes.id}\n- Trạng thái: ${status === 'PAUSED' ? '⚪ BẢN NHÁP (ĐANG TẮT) - Sẵn sàng để bạn xem lại trên Trình quản lý quảng cáo' : '🟢 ĐANG HOẠT ĐỘNG'}\n- Ngân sách ngày: ${daily_budget_vnd.toLocaleString('vi-VN')} đ/ngày\n- Tiêu đề: ${ad_headline}\n\n👉 Bạn hãy bấm F5 (Tải lại) trang Ads Manager trên Chrome để thấy chiến dịch mới xuất hiện ngay lập tức!`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Lỗi khi tạo chiến dịch: ${err.message}` }]
            };
        }
    }

    if (name === 'fb_optimize_adset') {
        try {
            const { adset_id, action, new_budget_vnd } = args;
            const payload = {};

            if (action === 'PAUSE') {
                payload.status = 'PAUSED';
            } else if (action === 'RESUME') {
                payload.status = 'ACTIVE';
            } else if (action === 'SCALE_UP_20') {
                const current = await fbApi(`${adset_id}?fields=daily_budget`);
                const currentBudget = parseInt(current.daily_budget || '100000');
                payload.daily_budget = Math.round(currentBudget * 1.2);
            } else if (action === 'SET_BUDGET') {
                if (!new_budget_vnd || new_budget_vnd < 50000) {
                    throw new Error('Ngân sách mới phải tối thiểu 50.000 VNĐ');
                }
                payload.daily_budget = new_budget_vnd;
            }

            const res = await fbApi(`${adset_id}`, 'POST', payload);
            return {
                content: [{
                    type: 'text',
                    text: `✅ ĐÃ ĐIỀU CHỈNH NHÓM QUẢNG CÁO (AdSet ID: ${adset_id}) THÀNH CÔNG!\n- Hành động: ${action}\n- Chi tiết thay đổi: ${JSON.stringify(payload)}`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Lỗi khi điều chỉnh AdSet: ${err.message}` }]
            };
        }
    }

    if (name === 'lyhu_get_customer_lifecycle_funnel') {
        try {
            const { ad_id: adIdFilter, days = 30 } = args;
            const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            let ep = `social_conversations?select=id,customer_name,customer_phone,customer_type,interested_products,ad_id,ad_title,source_type,created_at&created_at=gte.${cutoff}&order=created_at.desc&limit=2000`;
            if (adIdFilter) ep += `&ad_id=eq.${adIdFilter}`;

            const rows = await supabaseQuery(ep);
            if (!rows || rows.length === 0) {
                return {
                    content: [{
                        type: 'text',
                        text: `Không tìm thấy hội thoại nào trong ${days} ngày qua${adIdFilter ? ` cho bài QC ${adIdFilter}` : ''}.`
                    }]
                };
            }

            const groups = {};
            rows.forEach(r => {
                const key = r.ad_id || (r.source_type === 'organic' ? 'ORGANIC' : 'KHAC');
                if (!groups[key]) {
                    groups[key] = {
                        ad_id: key,
                        ad_title: r.ad_title || (key === 'ORGANIC' ? 'Khách tự nhiên (Organic)' : 'Chưa gắn mã QC'),
                        total_inbox: 0,
                        with_phone: 0,
                        b2b_leads: 0,
                        retail_leads: 0,
                        unclassified: 0,
                        types: {},
                        products: {},
                        sample_customers: []
                    };
                }
                const g = groups[key];
                g.total_inbox++;
                if (r.customer_phone) g.with_phone++;

                const ct = r.customer_type || 'Chưa phân loại';
                g.types[ct] = (g.types[ct] || 0) + 1;

                const isB2B = ['Bán sỉ', 'Đại lý', 'Nhà phân phối', 'Cửa hàng', 'Tạp hóa'].includes(ct);
                if (isB2B) g.b2b_leads++;
                else if (ct === 'Bán lẻ') g.retail_leads++;
                else g.unclassified++;

                if (Array.isArray(r.interested_products)) {
                    r.interested_products.forEach(p => {
                        g.products[p] = (g.products[p] || 0) + 1;
                    });
                }

                if (g.sample_customers.length < 5) {
                    g.sample_customers.push({
                        name: r.customer_name,
                        phone: r.customer_phone ? (r.customer_phone.slice(0, 4) + '***' + r.customer_phone.slice(-3)) : null,
                        type: r.customer_type || 'Chưa phân loại',
                        products: r.interested_products || []
                    });
                }
            });

            const formatted = Object.values(groups).map(g => {
                const b2bRate = g.total_inbox ? ((g.b2b_leads / g.total_inbox) * 100).toFixed(1) : '0';
                const phoneRate = g.total_inbox ? ((g.with_phone / g.total_inbox) * 100).toFixed(1) : '0';

                let verdict = '⚪ Cần thêm dữ liệu';
                if (Number(b2bRate) >= 25 && Number(phoneRate) >= 15) {
                    verdict = '🟢 HIỆU QUẢ CAO: Tệp ra nhiều khách sỉ & số điện thoại. Đề xuất TĂNG NGÂN SÁCH (Scale Up)';
                } else if (Number(b2bRate) < 10 && g.total_inbox >= 25) {
                    verdict = '🔴 KÉM HIỆU QUẢ: Nhiều tin nhắn nhưng hầu như không có khách sỉ. Đề xuất TẮT HOẶC SỬA NỘI DUNG/TARGET';
                }

                return `📊 BÀI QUẢNG CÁO: ${g.ad_title} (ID: ${g.ad_id})
  • Tổng Inbox (${days} ngày qua): ${g.total_inbox}
  • Có số điện thoại: ${g.with_phone} (${phoneRate}%)
  • Khách Sỉ / Đại lý / NPP: ${g.b2b_leads} (${b2bRate}%)
  • Khách Bán Lẻ: ${g.retail_leads} | Chưa phân loại: ${g.unclassified}
  • Sản phẩm quan tâm: ${Object.entries(g.products).map(([k,v]) => `${k} (${v})`).join(', ') || 'Chưa xác định'}
  • Đánh giá Claude: ${verdict}
  • Khách hàng mẫu:
${g.sample_customers.map(c => `    - ${c.name} | SĐT: ${c.phone || 'Chưa có'} | Phân loại: ${c.type} | SP: ${c.products.join(', ') || 'N/A'}`).join('\n')}`;
            }).join('\n\n' + '='.repeat(60) + '\n\n');

            return {
                content: [{
                    type: 'text',
                    text: `📈 BÁO CÁO VÒNG ĐỜI KHÁCH HÀNG & CHẤT LƯỢNG QUẢNG CÁO (${days} NGÀY QUA):\n\n${formatted}`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Lỗi khi lấy dữ liệu vòng đời: ${err.message}` }]
            };
        }
    }

    if (name === 'lyhu_get_customer_conversations') {
        try {
            const { ad_id: adId, limit = 5 } = args;
            if (!adId) throw new Error('Vui lòng cung cấp ad_id');

            const convs = await supabaseQuery(`social_conversations?select=id,customer_name,customer_phone,customer_type,interested_products,created_at&ad_id=eq.${adId}&order=created_at.desc&limit=${Math.min(20, limit)}`);
            if (!convs || convs.length === 0) {
                return {
                    content: [{
                        type: 'text',
                        text: `Không tìm thấy cuộc hội thoại nào cho bài quảng cáo ID ${adId}.`
                    }]
                };
            }

            const results = [];
            for (const c of convs) {
                const msgs = await supabaseQuery(`social_messages?conversation_id=eq.${c.id}&order=created_at.asc&limit=10&select=content,is_from_page,created_at`);
                results.push({
                    name: c.customer_name,
                    phone: c.customer_phone,
                    type: c.customer_type,
                    products: c.interested_products,
                    created_at: c.created_at,
                    messages: (msgs || []).map(m => `[${m.is_from_page ? 'Fanpage' : 'Khách'}]: ${m.content}`)
                });
            }

            const text = results.map((r, i) => `Khách #${i+1}: ${r.name} (${r.type || 'Chưa phân loại'}) - SĐT: ${r.phone || 'Không có'} - SP: ${(r.products || []).join(', ') || 'N/A'}\n` +
                r.messages.map(m => `  ${m}`).join('\n')
            ).join('\n\n--------------------------------------------\n\n');

            return {
                content: [{
                    type: 'text',
                    text: `💬 NỘI DUNG TRAO ĐỔI THỰC TẾ VỚI KHÁCH HÀNG (Bài QC: ${adId}):\n\n${text}`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Lỗi khi đọc tin nhắn khách hàng: ${err.message}` }]
            };
        }
    }

    if (name === 'lyhu_get_unified_ad_roi_report') {
        try {
            const timeRange = args.time_range || 'last_30d';
            const daysMap = { today: 1, yesterday: 2, last_7d: 7, last_30d: 30 };
            const days = daysMap[timeRange] || 30;

            // 1. Fetch Meta Ads Insights
            const endpoint = `${DEFAULT_AD_ACCOUNT_ID}/adsets?fields=id,name,status,daily_budget,campaign{id,name},insights.date_preset(${timeRange}){spend,impressions,clicks,cpc,actions}&limit=50`;
            const fbRes = await fbApi(endpoint);
            const adSets = fbRes.data || [];

            // 2. Fetch LYHU App Database Funnel
            const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            const convs = await supabaseQuery(`social_conversations?select=id,customer_phone,customer_type,interested_products,ad_id&created_at=gte.${cutoff}&order=created_at.desc&limit=2000`);

            // Map database stats by ad_id
            const dbMap = {};
            (convs || []).forEach(c => {
                if (!c.ad_id) return;
                if (!dbMap[c.ad_id]) {
                    dbMap[c.ad_id] = { inboxes: 0, phones: 0, b2b: 0, retail: 0, products: {} };
                }
                const m = dbMap[c.ad_id];
                m.inboxes++;
                if (c.customer_phone) m.phones++;
                if (['Bán sỉ', 'Đại lý', 'Nhà phân phối', 'Cửa hàng', 'Tạp hóa'].includes(c.customer_type)) m.b2b++;
                else if (c.customer_type === 'Bán lẻ') m.retail++;
                if (Array.isArray(c.interested_products)) {
                    c.interested_products.forEach(p => { m.products[p] = (m.products[p] || 0) + 1; });
                }
            });

            // 3. Merge Insights
            const merged = adSets.map((ad, idx) => {
                const ins = (ad.insights && ad.insights.data && ad.insights.data[0]) || {};
                const spend = Number(ins.spend || 0);
                const impressions = Number(ins.impressions || 0);
                const clicks = Number(ins.clicks || 0);
                const budget = ad.daily_budget ? Number(ad.daily_budget) : 0;

                // Meta reported messages
                let metaMsg = 0;
                if (ins.actions) {
                    const action = ins.actions.find(a => a.action_type.includes('message'));
                    if (action) metaMsg = Number(action.value || 0);
                }

                // Check DB metrics by adset id or associated ad ids
                const db = dbMap[ad.id] || { inboxes: metaMsg, phones: 0, b2b: 0, retail: 0, products: {} };
                const costPerB2B = db.b2b > 0 ? Math.round(spend / db.b2b).toLocaleString('vi-VN') + ' đ' : (spend > 0 ? 'Chưa ra khách sỉ' : '0 đ');
                const costPerPhone = db.phones > 0 ? Math.round(spend / db.phones).toLocaleString('vi-VN') + ' đ' : (spend > 0 ? 'Chưa có SĐT' : '0 đ');
                const b2bQuality = db.inboxes > 0 ? ((db.b2b / db.inboxes) * 100).toFixed(1) + '%' : '0%';

                let aiDecision = '⚪ THEO DÕI THÊM';
                if (db.b2b >= 5 && spend > 0 && (spend / db.b2b) <= 300000) {
                    aiDecision = '🚀 SCALE UP (TĂNG 20% NGÂN SÁCH): Chi phí trên 1 khách sỉ rất tốt, tệp chuẩn';
                } else if (spend > 500000 && db.b2b === 0) {
                    aiDecision = '🛑 PAUSE (TẮT QUẢNG CÁO): Chi tiêu đã cao nhưng 100% không ra khách sỉ';
                }

                return `[#${idx + 1}] AdSet: ${ad.name} (ID: ${ad.id})
  • Trạng thái: ${ad.status === 'ACTIVE' ? '🟢 ĐANG BẬT' : '⚪ ĐANG TẮT'} | Ngân sách: ${budget.toLocaleString('vi-VN')} đ/ngày
  • Chi tiêu (${timeRange}): ${spend.toLocaleString('vi-VN')} đ
  • Lượt xem: ${impressions.toLocaleString('vi-VN')} | Clicks: ${clicks}
  • 📥 Vòng đời LYHU App:
    - Tổng Inbox: ${db.inboxes} | Có SĐT: ${db.phones}
    - Khách Sỉ / Đại lý: ${db.b2b} (${b2bQuality})
    - Chi phí trên 1 Khách Sỉ (CPBL): ${costPerB2B}
    - Chi phí trên 1 SĐT: ${costPerPhone}
  • 👉 QUYẾT ĐỊNH TỐI ƯU CỦA CLAUDE: ${aiDecision}`;
            }).join('\n\n' + '-'.repeat(50) + '\n\n');

            return {
                content: [{
                    type: 'text',
                    text: `🎯 BÁO CÁO HỢP NHẤT HIỆU QUẢ QUẢNG CÁO & VÒNG ĐỜI KHÁCH HÀNG (${timeRange.toUpperCase()}):\n\n${merged}`
                }]
            };
        } catch (err) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Lỗi khi tổng hợp báo cáo ROI: ${err.message}` }]
            };
        }
    }

    return {
        isError: true,
        content: [{ type: 'text', text: `Công cụ không xác định: ${name}` }]
    };
}

// JSON-RPC message loop via stdio
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

function sendJson(msg) {
    process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
        const req = JSON.parse(line);
        if (req.method === 'initialize') {
            sendJson({
                jsonrpc: '2.0',
                id: req.id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: {
                        name: 'lyhu-ads-manager',
                        version: '1.0.0'
                    }
                }
            });
        } else if (req.method === 'notifications/initialized') {
            log('Client initialized');
        } else if (req.method === 'tools/list') {
            sendJson({
                jsonrpc: '2.0',
                id: req.id,
                result: {
                    tools: TOOLS
                }
            });
        } else if (req.method === 'tools/call') {
            const { name, arguments: args } = req.params;
            log(`Calling tool ${name} with args:`, args);
            const res = await handleToolCall(name, args || {});
            sendJson({
                jsonrpc: '2.0',
                id: req.id,
                result: res
            });
        } else {
            sendJson({
                jsonrpc: '2.0',
                id: req.id,
                error: {
                    code: -32601,
                    message: `Method not found: ${req.method}`
                }
            });
        }
    } catch (err) {
        log('Error parsing input JSON:', err.message);
    }
});

log('LYHU Meta Ads MCP Server is ready on stdio.');
