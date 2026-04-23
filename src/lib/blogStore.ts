import { supabase } from './supabaseClient';

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface BlogPost {
    id: string;
    category_id: string | null;
    title: string;
    slug: string;
    content: string;
    thumbnail_url: string | null;
    
    // SEO & AEO Metadata
    ai_summary: string | null;
    meta_title: string | null;
    meta_description: string | null;
    keywords: string | null;
    faq_data: any; // JSONB array of {question, answer}
    
    status: 'draft' | 'published' | 'archived';
    author_id: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    
    // Joined fields
    category?: Partial<BlogCategory>;
    author?: { full_name: string, email: string, avatar_url?: string };
}

// ----------------------------------------------------------------------
// CATEGORIES
// ----------------------------------------------------------------------

export async function getBlogCategories(): Promise<BlogCategory[]> {
    const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });
        
    if (error) throw error;
    return data as BlogCategory[];
}

export async function createBlogCategory(categoryData: Partial<BlogCategory>): Promise<BlogCategory> {
    const { data, error } = await supabase
        .from('blog_categories')
        .insert(categoryData)
        .select()
        .single();
        
    if (error) throw error;
    return data as BlogCategory;
}

// ----------------------------------------------------------------------
// POSTS
// ----------------------------------------------------------------------

export async function getBlogPosts(options?: {
    status?: 'draft' | 'published' | 'archived';
    categoryId?: string;
    limit?: number;
}): Promise<BlogPost[]> {
    let query = supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug),
            author:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });
        
    if (options?.status) {
        query = query.eq('status', options.status);
    }
    if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as BlogPost[];
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug),
            author:profiles(full_name, email)
        `)
        .eq('id', id)
        .single();
        
    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data as BlogPost;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select(`
            *,
            category:blog_categories(id, name, slug),
            author:profiles(full_name, email)
        `)
        .eq('slug', slug)
        .eq('status', 'published') // public view only published
        .single();
        
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data as BlogPost;
}

export async function saveBlogPost(postData: Partial<BlogPost>): Promise<BlogPost> {
    // If published status is changing to published, set published_at
    if (postData.status === 'published' && !postData.published_at) {
        postData.published_at = new Date().toISOString();
    }
    
    postData.updated_at = new Date().toISOString();
    
    if (postData.id) {
        // Update
        const { data, error } = await supabase
            .from('blog_posts')
            .update(postData)
            .eq('id', postData.id)
            .select()
            .single();
            
        if (error) throw error;
        return data as BlogPost;
    } else {
        // Insert
        const { data, error } = await supabase
            .from('blog_posts')
            .insert(postData)
            .select()
            .single();
            
        if (error) throw error;
        return data as BlogPost;
    }
}

export async function deleteBlogPost(id: string): Promise<void> {
    const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
}

// Helper to generate slug from title
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
        .replace(/\s+/g, "-") // collapse whitespace and replace by -
        .replace(/-+/g, "-") // collapse dashes
        .replace(/^-+/, "") // trim - from start of text
        .replace(/-+$/, ""); // trim - from end of text
}
