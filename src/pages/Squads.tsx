import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Users, Settings, Copy } from 'lucide-react';
import { toast } from 'sonner';

const Squads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    
    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map(m => m.group_id);
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      
      // Get member counts
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          return { ...group, memberCount: count || 0 };
        })
      );
      setGroups(groupsWithCounts);
    } else {
      setGroups([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ group_name: newGroupName.trim(), admin_user_id: user.id })
      .select()
      .single();
    
    if (error) { toast.error(error.message); return; }
    
    // Add creator as member
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
    
    setCreateOpen(false);
    setNewGroupName('');
    toast.success('Squad created!');
    fetchGroups();
  };

  const handleJoinGroup = async () => {
    if (!user || !joinCode.trim()) return;
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', joinCode.trim())
      .single();
    
    if (!group) { toast.error('Invalid invite code'); return; }
    
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id });
    
    if (error) {
      if (error.code === '23505') toast.info('Already a member!');
      else toast.error(error.message);
      return;
    }
    
    setJoinOpen(false);
    setJoinCode('');
    toast.success('Joined squad!');
    fetchGroups();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="My Squads" accentBg />

      <div className="flex-1 px-4 pt-4 space-y-3">
        {/* Create Squad */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-xl bg-primary text-primary-foreground font-display uppercase tracking-wider">
              Create New Squad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display uppercase">Create Squad</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Squad name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Button onClick={handleCreateGroup} className="w-full bg-primary text-primary-foreground font-display uppercase">
              Create
            </Button>
          </DialogContent>
        </Dialog>

        {/* Join with Code */}
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full rounded-xl font-display uppercase tracking-wider">
              Join with Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display uppercase">Join Squad</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Enter invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <Button onClick={handleJoinGroup} className="w-full bg-primary text-primary-foreground font-display uppercase">
              Join
            </Button>
          </DialogContent>
        </Dialog>

        {/* Current Squads */}
        <div className="mt-4">
          <h2 className="mb-3 text-xs font-display uppercase tracking-wider text-muted-foreground">
            Current Squads ({groups.length})
          </h2>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No squads yet. Create or join one!</div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/squads/${group.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-sm font-bold uppercase">{group.group_name}</h3>
                    <p className="text-xs text-muted-foreground">{group.memberCount} Members</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(group.invite_code);
                        toast.success('Invite code copied!');
                      }}
                      className="rounded-lg p-2 hover:bg-muted"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/squads/${group.id}/settings`);
                      }}
                      className="rounded-lg p-2 hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Squads;
