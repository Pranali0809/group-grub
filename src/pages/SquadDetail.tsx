import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Copy, Play } from 'lucide-react';
import { toast } from 'sonner';

const SquadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: groupData } = await supabase.from('groups').select('*').eq('id', id).single();
      setGroup(groupData);

      // Fetch members first
      const { data: membersData } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id);
      
      // Then fetch profiles for those members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, profile_image, email')
          .in('user_id', userIds);
        
        // Combine members with profiles
        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profiles: profilesData?.find(p => p.user_id === member.user_id) || null
        }));
        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('group_id', id)
        .eq('status', 'active');
      setActiveSessions(sessions || []);
    };
    fetchData();
  }, [id]);

  const startSession = async () => {
    if (!user || !id) return;

    // Get all member wishlist items
    const memberIds = members.map(m => m.user_id);
    const { data: allItems } = await supabase
      .from('wishlist_items')
      .select('*')
      .in('user_id', memberIds);

    if (!allItems || allItems.length === 0) {
      toast.error('No restaurants in any member wishlist!');
      return;
    }

    // Deduplicate by restaurant name (case-insensitive)
    const seen = new Set<string>();
    const uniqueItems = allItems.filter(item => {
      const key = item.restaurant_name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Create session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ group_id: id, started_by_user_id: user.id })
      .select()
      .single();

    if (error) { toast.error(error.message); return; }

    // Add restaurants to session
    const sessionRestaurants = uniqueItems.map(item => ({
      session_id: session.id,
      wishlist_item_id: item.id,
      restaurant_name: item.restaurant_name,
      restaurant_image: item.restaurant_image,
      cuisine_tag: item.cuisine_tag,
      price_category: item.price_category,
      price_range: item.price_range,
      highlight_tag: item.highlight_tag,
      custom_tags: item.custom_tags,
      link: item.google_maps_link,
    }));

    await supabase.from('session_restaurants').insert(sessionRestaurants);

    toast.success('Voting session started!');
    navigate(`/voting/${session.id}`);
  };

  if (!group) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title={group.group_name} showBack accentBg />

      <div className="flex-1 px-4 pt-4 space-y-4">
        {/* Invite Code */}
        <div className="flex items-center justify-between rounded-xl bg-card p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Invite Code</p>
            <p className="font-display text-lg font-bold tracking-wider">{group.invite_code}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(group.invite_code);
              toast.success('Copied!');
            }}
            className="rounded-lg bg-primary/20 p-2"
          >
            <Copy className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Members */}
        <div>
          <h2 className="mb-2 text-xs font-display uppercase tracking-wider text-muted-foreground">
            Members ({members.length})
          </h2>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-xl bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(member.profiles as any)?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{(member.profiles as any)?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{(member.profiles as any)?.email}</p>
                </div>
                {member.user_id === group.admin_user_id && (
                  <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-display uppercase text-primary">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div>
            <h2 className="mb-2 text-xs font-display uppercase tracking-wider text-muted-foreground">
              Active Sessions
            </h2>
            {activeSessions.map(session => (
              <button
                key={session.id}
                onClick={() => navigate(`/voting/${session.id}`)}
                className="w-full rounded-xl bg-primary/20 p-3 text-left"
              >
                <p className="font-display text-sm font-bold text-primary">Join Voting Session →</p>
              </button>
            ))}
          </div>
        )}

        {/* Start Session */}
        <Button
          onClick={startSession}
          className="w-full rounded-xl bg-primary text-primary-foreground font-display uppercase tracking-wider"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Voting Session
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SquadDetail;
