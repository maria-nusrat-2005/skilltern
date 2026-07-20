-- Migration: Add Platform Announcements Schema
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    target_audience TEXT NOT NULL DEFAULT 'Everyone', -- 'Everyone', 'Students Only', 'Companies Only', 'Admin Only'
    banner_image TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    publish_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Published', -- 'Draft', 'Published', 'Scheduled', 'Expired', 'Archived'
    created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public announcements read policy" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Admin full access announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users read status policy" ON public.announcement_reads
    FOR ALL USING (user_id = auth.uid());
