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
