import { supabase } from "@/lib/supabaseClient";

export interface CultureSection {
    id: string;
    title: string;
    content: string;
    order_index: number;
    created_at: string;
}

export async function getCultureSections(): Promise<CultureSection[]> {
    const { data, error } = await supabase
        .from('culture_sections')
        .select('*')
        .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data || [];
}

export async function createCultureSection(title: string, order_index: number): Promise<CultureSection> {
    const { data, error } = await supabase
        .from('culture_sections')
        .insert([{ title, content: '<p>Bắt đầu nhập nội dung tại đây...</p>', order_index }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function updateCultureSection(id: string, updates: Partial<CultureSection>): Promise<void> {
    const { error } = await supabase
        .from('culture_sections')
        .update(updates)
        .eq('id', id);
    
    if (error) throw error;
}

export async function deleteCultureSection(id: string): Promise<void> {
    const { error } = await supabase
        .from('culture_sections')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}
