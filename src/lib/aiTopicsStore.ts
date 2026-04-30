import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type AINewsTopic = {
    id: string;
    content: string;
    is_active: boolean;
    created_at: string;
};

export async function getAITopics(): Promise<AINewsTopic[]> {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
        .from('ai_news_topics')
        .select('*')
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
}

export async function createAITopic(content: string): Promise<AINewsTopic> {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
        .from('ai_news_topics')
        .insert([{ content, is_active: true }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function updateAITopic(id: string, updates: Partial<AINewsTopic>): Promise<void> {
    const supabase = createClientComponentClient();
    const { error } = await supabase
        .from('ai_news_topics')
        .update(updates)
        .eq('id', id);
    
    if (error) throw error;
}

export async function deleteAITopic(id: string): Promise<void> {
    const supabase = createClientComponentClient();
    const { error } = await supabase
        .from('ai_news_topics')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}
