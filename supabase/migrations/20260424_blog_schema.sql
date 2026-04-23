-- Migration: 20260424_blog_schema.sql
-- Description: Create tables for SEO & AEO optimized Blog module

-- 1. Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- SEO & AEO Metadata
    ai_summary TEXT, -- TL;DR for Answer Engine Optimization
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT,
    faq_data JSONB DEFAULT '[]'::jsonb, -- JSON array of {question: text, answer: text}
    
    -- Status and Authorship
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Categories RLS
-- 1. Public can read all categories
CREATE POLICY "Public can read categories"
    ON public.blog_categories FOR SELECT
    USING (true);

-- 2. Admin, Marketing, Media Creator can manage categories
CREATE POLICY "Internal roles can insert categories"
    ON public.blog_categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );

CREATE POLICY "Internal roles can update categories"
    ON public.blog_categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );

CREATE POLICY "Internal roles can delete categories"
    ON public.blog_categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );

-- Posts RLS
-- 1. Public can read published posts
CREATE POLICY "Public can read published posts"
    ON public.blog_posts FOR SELECT
    USING (status = 'published');

-- 2. Internal roles can read all posts
CREATE POLICY "Internal roles can read all posts"
    ON public.blog_posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );

-- 3. Internal roles can insert posts
CREATE POLICY "Internal roles can insert posts"
    ON public.blog_posts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );

-- 4. Internal roles can update posts
CREATE POLICY "Internal roles can update posts"
    ON public.blog_posts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );

-- 5. Internal roles can delete posts
CREATE POLICY "Internal roles can delete posts"
    ON public.blog_posts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'marketing', 'media_creator')
        )
    );
