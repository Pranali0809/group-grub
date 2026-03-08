
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- group_members
DROP POLICY IF EXISTS "Users can view own memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group co-members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Users can view own memberships" ON public.group_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view group co-members" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- groups
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Admin can update group" ON public.groups;

CREATE POLICY "Authenticated users can view groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "Admin can update group" ON public.groups FOR UPDATE TO authenticated USING (auth.uid() = admin_user_id);

-- wishlist_items
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Group members can view wishlists for sessions" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update own wishlist" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist_items;

CREATE POLICY "Users can view own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Group members can view wishlists for sessions" ON public.wishlist_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm1
    WHERE gm1.user_id = auth.uid()
    AND public.is_group_member(wishlist_items.user_id, gm1.group_id)
  )
);
CREATE POLICY "Users can insert own wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wishlist" ON public.wishlist_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- sessions
DROP POLICY IF EXISTS "Group members can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Group members can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Members can update sessions" ON public.sessions;

CREATE POLICY "Group members can view sessions" ON public.sessions FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members can create sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = started_by_user_id AND public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Members can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (public.is_group_member(auth.uid(), group_id));

-- session_restaurants
DROP POLICY IF EXISTS "Group members can view session restaurants" ON public.session_restaurants;
DROP POLICY IF EXISTS "Group members can insert session restaurants" ON public.session_restaurants;

CREATE POLICY "Group members can view session restaurants" ON public.session_restaurants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_restaurants.session_id AND public.is_group_member(auth.uid(), s.group_id)));
CREATE POLICY "Group members can insert session restaurants" ON public.session_restaurants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_restaurants.session_id AND public.is_group_member(auth.uid(), s.group_id)));

-- votes
DROP POLICY IF EXISTS "Users can cast votes" ON public.votes;
DROP POLICY IF EXISTS "Group members can view votes" ON public.votes;

CREATE POLICY "Users can cast votes" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group members can view votes" ON public.votes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = votes.session_id AND public.is_group_member(auth.uid(), s.group_id)));

-- hangouts
DROP POLICY IF EXISTS "Group members can view hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Group members can create hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Group members can update hangouts" ON public.hangouts;

CREATE POLICY "Group members can view hangouts" ON public.hangouts FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members can create hangouts" ON public.hangouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by_user_id AND public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members can update hangouts" ON public.hangouts FOR UPDATE TO authenticated USING (public.is_group_member(auth.uid(), group_id));

-- memories
DROP POLICY IF EXISTS "Group members can view memories" ON public.memories;
DROP POLICY IF EXISTS "Users can upload memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;

CREATE POLICY "Group members can view memories" ON public.memories FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM hangouts h WHERE h.id = memories.hangout_id AND public.is_group_member(auth.uid(), h.group_id)));
CREATE POLICY "Users can upload memories" ON public.memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by_user_id);
CREATE POLICY "Users can delete own memories" ON public.memories FOR DELETE TO authenticated USING (auth.uid() = uploaded_by_user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
