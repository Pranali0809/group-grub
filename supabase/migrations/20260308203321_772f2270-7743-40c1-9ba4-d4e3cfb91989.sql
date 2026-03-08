-- Create a security definer function to check group membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Drop existing problematic policies on group_members
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

-- Create new non-recursive policies for group_members
CREATE POLICY "Users can view own memberships"
ON public.group_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view group co-members"
ON public.group_members
FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.group_members
FOR DELETE
USING (auth.uid() = user_id);

-- Fix hangouts policies to use security definer function
DROP POLICY IF EXISTS "Group members can view hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Group members can create hangouts" ON public.hangouts;
DROP POLICY IF EXISTS "Group members can update hangouts" ON public.hangouts;

CREATE POLICY "Group members can view hangouts"
ON public.hangouts FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create hangouts"
ON public.hangouts FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update hangouts"
ON public.hangouts FOR UPDATE
USING (public.is_group_member(auth.uid(), group_id));

-- Fix sessions policies
DROP POLICY IF EXISTS "Group members can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Group members can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Members can update sessions" ON public.sessions;

CREATE POLICY "Group members can view sessions"
ON public.sessions FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create sessions"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = started_by_user_id AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can update sessions"
ON public.sessions FOR UPDATE
USING (public.is_group_member(auth.uid(), group_id));

-- Fix session_restaurants policies
DROP POLICY IF EXISTS "Group members can view session restaurants" ON public.session_restaurants;
DROP POLICY IF EXISTS "Group members can insert session restaurants" ON public.session_restaurants;

CREATE POLICY "Group members can view session restaurants"
ON public.session_restaurants FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.id = session_restaurants.session_id
  AND public.is_group_member(auth.uid(), s.group_id)
));

CREATE POLICY "Group members can insert session restaurants"
ON public.session_restaurants FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.id = session_restaurants.session_id
  AND public.is_group_member(auth.uid(), s.group_id)
));

-- Fix votes policies
DROP POLICY IF EXISTS "Group members can view votes" ON public.votes;

CREATE POLICY "Group members can view votes"
ON public.votes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sessions s
  WHERE s.id = votes.session_id
  AND public.is_group_member(auth.uid(), s.group_id)
));

-- Fix memories policies
DROP POLICY IF EXISTS "Group members can view memories" ON public.memories;

CREATE POLICY "Group members can view memories"
ON public.memories FOR SELECT
USING (EXISTS (
  SELECT 1 FROM hangouts h
  WHERE h.id = memories.hangout_id
  AND public.is_group_member(auth.uid(), h.group_id)
));

-- Fix wishlist_items policy
DROP POLICY IF EXISTS "Group members can view wishlists for sessions" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist_items;

CREATE POLICY "Users can view own wishlist"
ON public.wishlist_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Group members can view wishlists for sessions"
ON public.wishlist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm1
    WHERE gm1.user_id = auth.uid()
    AND public.is_group_member(wishlist_items.user_id, gm1.group_id)
  )
);