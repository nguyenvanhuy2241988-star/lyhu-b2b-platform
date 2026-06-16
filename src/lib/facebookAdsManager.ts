export interface FbAdSetupParams {
    accessToken: string;
    adAccountId: string;
    campaignName: string;
    objective: "OUTCOME_TRAFFIC" | "OUTCOME_ENGAGEMENT";
    dailyBudget: number;
    pageId: string;
    message: string;
    imageFile: File;
}

export const autoSetupFacebookAds = async (params: FbAdSetupParams): Promise<boolean> => {
    const { accessToken, adAccountId, campaignName, objective, dailyBudget, pageId, message, imageFile } = params;
    const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const baseUrl = `https://graph.facebook.com/v19.0`;

    try {
        // STEP 1: Create Campaign
        const campRes = await fetch(`${baseUrl}/${actId}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: campaignName,
                objective: objective,
                status: 'PAUSED', // Start paused for safety
                special_ad_categories: [], // Required by FB API
                access_token: accessToken
            })
        });
        if (!campRes.ok) throw new Error("Tạo Campaign thất bại: " + (await campRes.text()));
        const campData = await campRes.json();
        const campaignId = campData.id;

        // STEP 2: Create AdSet
        const adSetRes = await fetch(`${baseUrl}/${actId}/adsets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `${campaignName} - AdSet`,
                campaign_id: campaignId,
                billing_event: 'IMPRESSIONS',
                optimization_goal: objective === 'OUTCOME_TRAFFIC' ? 'LINK_CLICKS' : 'POST_ENGAGEMENT',
                daily_budget: dailyBudget,
                bid_amount: 1000, // Minimal bid
                targeting: {
                    geo_locations: { countries: ['VN'] }
                },
                status: 'PAUSED',
                access_token: accessToken
            })
        });
        if (!adSetRes.ok) throw new Error("Tạo AdSet thất bại: " + (await adSetRes.text()));
        const adSetData = await adSetRes.json();
        const adSetId = adSetData.id;

        // STEP 3: Upload Image
        const formData = new FormData();
        formData.append('filename', imageFile);
        formData.append('access_token', accessToken);
        
        const imgRes = await fetch(`${baseUrl}/${actId}/adimages`, {
            method: 'POST',
            body: formData
        });
        if (!imgRes.ok) throw new Error("Upload Image thất bại: " + (await imgRes.text()));
        const imgData = await imgRes.json();
        const imageHash = imgData.images[imageFile.name].hash;

        // STEP 4: Create Ad Creative
        const creativeRes = await fetch(`${baseUrl}/${actId}/adcreatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `${campaignName} - Creative`,
                object_story_spec: {
                    page_id: pageId,
                    link_data: {
                        image_hash: imageHash,
                        link: "https://lyhu.com.vn", // Fallback link
                        message: message
                    }
                },
                access_token: accessToken
            })
        });
        if (!creativeRes.ok) throw new Error("Tạo Creative thất bại: " + (await creativeRes.text()));
        const creativeData = await creativeRes.json();
        const creativeId = creativeData.id;

        // STEP 5: Create Ad
        const adRes = await fetch(`${baseUrl}/${actId}/ads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `${campaignName} - Ad 1`,
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: 'PAUSED',
                access_token: accessToken
            })
        });
        if (!adRes.ok) throw new Error("Tạo Ad thất bại: " + (await adRes.text()));
        
        return true;
    } catch (err: any) {
        console.error("autoSetupFacebookAds Error:", err);
        throw new Error(err.message || "Có lỗi xảy ra khi gọi API Facebook");
    }
};

export const fetchFbCampaignInsights = async (
    accessToken: string,
    campaignId: string,
    datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'this_month' | 'lifetime' = 'last_7d'
) => {
    try {
        const baseUrl = `https://graph.facebook.com/v19.0`;
        const url = `${baseUrl}/${campaignId}/insights?fields=spend,impressions,clicks,cpc,ctr,actions,reach,frequency,cost_per_action_type&date_preset=${datePreset}&access_token=${accessToken}`;
        
        const res = await fetch(url);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error?.message || 'FB Insights API Error');
        }
        
        const data = await res.json();
        return data.data && data.data.length > 0 ? data.data[0] : null;
    } catch (e: any) {
        console.error("fetchFbCampaignInsights Error:", e);
        throw e;
    }
};

export const fetchFbCampaignDetails = async (accessToken: string, campaignId: string) => {
    try {
        const baseUrl = `https://graph.facebook.com/v19.0`;
        
        // Fetch Campaign Info (for Objective)
        const campRes = await fetch(`${baseUrl}/${campaignId}?fields=name,objective&access_token=${accessToken}`);
        const campData = await campRes.json();

        // Fetch AdSets (for Targeting)
        const adSetRes = await fetch(`${baseUrl}/${campaignId}/adsets?fields=name,targeting,daily_budget&access_token=${accessToken}`);
        const adSetData = await adSetRes.json();
        
        // Fetch Ads (for Creative info)
        const adRes = await fetch(`${baseUrl}/${campaignId}/ads?fields=name,creative{image_url,thumbnail_url,body,title,object_story_spec,video_id,asset_feed_spec}&access_token=${accessToken}`);
        const adData = await adRes.json();
        
        return {
            campaign: campData,
            adSets: adSetData.data || [],
            ads: adData.data || []
        };
    } catch (e: any) {
        console.error("fetchFbCampaignDetails Error:", e);
        return { campaign: null, adSets: [], ads: [] };
    }
};

export const fetchAllCampaignsInsights = async (accessToken: string, adAccountId: string) => {
    try {
        const baseUrl = `https://graph.facebook.com/v19.0`;
        const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        // Fetch insights grouped by campaign for the last 7 days
        const res = await fetch(`${baseUrl}/${actId}/insights?level=campaign&fields=campaign_id,spend,cpc,ctr,cost_per_action_type&date_preset=last_7d&limit=100&access_token=${accessToken}`);
        
        if (!res.ok) {
            console.error("fetchAllCampaignsInsights Error Response", await res.text());
            return [];
        }
        const data = await res.json();
        return data.data || [];
    } catch (e: any) {
        console.error("fetchAllCampaignsInsights Error:", e);
        return [];
    }
};
