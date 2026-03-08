
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ CREATE ALL TABLES FIRST ============

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  google_maps_link TEXT,
  restaurant_image TEXT,
  cuisine_tag TEXT,
  price_category TEXT,
  price_range TEXT,
  highlight_tag TEXT,
  custom_tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  started_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.session_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  wishlist_item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  restaurant_image TEXT,
  cuisine_tag TEXT,
  price_category TEXT,
  price_range TEXT,
  highlight_tag TEXT,
  custom_tags TEXT[],
  UNIQUE(session_id, wishlist_item_id)
);

CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wishlist_item_id UUID NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('accept', 'reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id, wishlist_item_id)
);

CREATE TABLE public.hangouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  restaurant_image TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangout_id UUID NOT NULL REFERENCES public.hangouts(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ ENABLE RLS ON ALL TABLES ============

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Groups
CREATE POLICY "Authenticated users can view groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "Admin can update group" ON public.groups FOR UPDATE TO authenticated USING (auth.uid() = admin_user_id);

-- Group Members
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Wishlist Items
CREATE POLICY "Users can view own wishlist" ON public.wishlist_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Group members can view wishlists for sessions" ON public.wishlist_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = wishlist_items.user_id
  ));
CREATE POLICY "Users can insert own wishlist" ON public.wishlist_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlist" ON public.wishlist_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlist_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Group members can view sessions" ON public.sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = sessions.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Group members can create sessions" ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = started_by_user_id AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = sessions.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Members can update sessions" ON public.sessions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = sessions.group_id AND gm.user_id = auth.uid()));

-- Session Restaurants
CREATE POLICY "Group members can view session restaurants" ON public.session_restaurants FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.group_members gm ON gm.group_id = s.group_id
    WHERE s.id = session_restaurants.session_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Group members can insert session restaurants" ON public.session_restaurants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.group_members gm ON gm.group_id = s.group_id
    WHERE s.id = session_restaurants.session_id AND gm.user_id = auth.uid()
  ));

-- Votes
CREATE POLICY "Group members can view votes" ON public.votes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.group_members gm ON gm.group_id = s.group_id
    WHERE s.id = votes.session_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Users can cast votes" ON public.votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Hangouts
CREATE POLICY "Group members can view hangouts" ON public.hangouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = hangouts.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Group members can create hangouts" ON public.hangouts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by_user_id AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = hangouts.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Group members can update hangouts" ON public.hangouts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = hangouts.group_id AND gm.user_id = auth.uid()));

-- Memories
CREATE POLICY "Group members can view memories" ON public.memories FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hangouts h
    JOIN public.group_members gm ON gm.group_id = h.group_id
    WHERE h.id = memories.hangout_id AND gm.user_id = auth.uid()
  ));
CREATE POLICY "Users can upload memories" ON public.memories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by_user_id);
CREATE POLICY "Users can delete own memories" ON public.memories FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by_user_id);

-- ============ TRIGGERS ============

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, profile_image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ INDEXES ============

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX idx_sessions_group ON public.sessions(group_id);
CREATE INDEX idx_votes_session ON public.votes(session_id);
CREATE INDEX idx_votes_user ON public.votes(user_id);
CREATE INDEX idx_hangouts_group ON public.hangouts(group_id);
CREATE INDEX idx_memories_hangout ON public.memories(hangout_id);
CREATE INDEX idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX idx_session_restaurants_session ON public.session_restaurants(session_id);

-- ============ STORAGE ============

INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('memory-photos', 'memory-photos', true);

CREATE POLICY "Anyone can view restaurant images" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-images');
CREATE POLICY "Authenticated users can upload restaurant images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'restaurant-images');
CREATE POLICY "Anyone can view memory photos" ON storage.objects FOR SELECT USING (bucket_id = 'memory-photos');
CREATE POLICY "Authenticated users can upload memory photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memory-photos');
