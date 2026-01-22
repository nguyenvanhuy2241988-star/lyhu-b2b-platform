import { supabase } from "@/lib/supabaseClient";

export const getCRMBanner = async () => {
    const { data, error } = await supabase
        .from('crm_settings')
        .select('banner_url')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found if empty
    return data?.banner_url as string | null;
};

export const updateCRMBanner = async (url: string | null) => {
    const { data, error } = await supabase
        .from('crm_settings')
        .upsert({ id: 1, banner_url: url, updated_at: new Date().toISOString() })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Reuse existing uploadHRAsset or make a new generic one?
// Let's use uploadHRAsset logic but maybe pointing to a general bucket if wanted, 
// for now HR assets bucket is fine or we create a 'crm-assets' bucket.
// Since I cannot create buckets with SQL easily without storage extension knowledge confirming it exists,
// I will reuse the existing 'hr_assets' bucket which I know works, or 'avatars'.
// Let's reuse 'hr_assets' for simplicity as it's an "asset".
export const uploadCRMAsset = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `crm-banner-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('hr-assets') // Reusing HR bucket
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('hr-assets').getPublicUrl(filePath);
    return data.publicUrl;
};
