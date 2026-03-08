import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Users, Settings, Copy } from 'lucide-react';
import { toast } from 'sonner';

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';
const shadowSm = '2px 2px 0px 0px hsl(0 0% 8%)';

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
    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map(m => m.group_id);
      const { data: groupsData } = await supabase.from('groups').select('*').in('id', groupIds);
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', group.id);
          return { ...group, memberCount: count || 0 };
        })
      );
      setGroups(groupsWithCounts);
    } else { setGroups([]); }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    const { data: group, error } = await supabase.from('groups').insert({ group_name: newGroupName.trim(), admin_user_id: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
    setCreateOpen(false); setNewGroupName('');
    toast.success('Squad created!'); fetchGroups();
  };

  const handleJoinGroup = async () => {
    if (!user || !joinCode.trim()) return;
    const { data: group } = await supabase.from('groups').select('id').eq('invite_code', joinCode.trim()).single();
    if (!group) { toast.error('Invalid invite code'); return; }
    const { error } = await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
    if (error) { if (error.code === '23505') toast.info('Already a member!'); else toast.error(error.message); return; }
    setJoinOpen(false); setJoinCode('');
    toast.success('Joined squad!'); fetchGroups();
  };

  return (
    <div className="flex min-h-screen flex-col pb-16" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="My Squads" />

      <div className="flex-1 px-4 pt-3 space-y-2.5">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <button className="w-full h-11 rounded-full bg-squad-pink border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
              style={{ boxShadow: shadow }}>Create New Squad</button>
          </DialogTrigger>
          <DialogContent className="border-2 border-foreground rounded-2xl" style={{ boxShadow: '4px 4px 0px 0px hsl(0 0% 8%)' }}>
            <DialogHeader><DialogTitle className="font-display text-[11px] uppercase tracking-[0.2em] font-bold">Create Squad</DialogTitle></DialogHeader>
            <div className="rounded-full" style={{ boxShadow: shadowSm }}>
              <Input placeholder="Squad name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
            </div>
            <button onClick={handleCreateGroup}
              className="w-full h-10 rounded-full bg-squad-pink border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
              style={{ boxShadow: shadow }}>Create</button>
          </DialogContent>
        </Dialog>

        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <button className="w-full h-11 rounded-full bg-card border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
              style={{ boxShadow: shadow }}>Join with Code</button>
          </DialogTrigger>
          <DialogContent className="border-2 border-foreground rounded-2xl" style={{ boxShadow: '4px 4px 0px 0px hsl(0 0% 8%)' }}>
            <DialogHeader><DialogTitle className="font-display text-[11px] uppercase tracking-[0.2em] font-bold">Join Squad</DialogTitle></DialogHeader>
            <div className="rounded-full" style={{ boxShadow: shadowSm }}>
              <Input placeholder="Enter invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
            </div>
            <button onClick={handleJoinGroup}
              className="w-full h-10 rounded-full bg-squad-pink border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
              style={{ boxShadow: shadow }}>Join</button>
          </DialogContent>
        </Dialog>

        <div className="mt-1">
          <h2 className="mb-2 text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Current Squads ({groups.length})</h2>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground font-display text-[10px] uppercase tracking-[0.15em]">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground font-display text-[10px] uppercase tracking-[0.15em]">No squads yet</div>
          ) : (
            <div className="space-y-2.5">
              {groups.map((group) => (
                <button key={group.id} onClick={() => navigate(`/squads/${group.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-foreground bg-card p-3 text-left" style={{ boxShadow: shadowSm }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground bg-squad-lavender"
                    style={{ boxShadow: shadowSm }}>
                    <Users className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">{group.group_name}</h3>
                    <p className="text-[9px] font-display uppercase tracking-[0.1em] text-muted-foreground">{group.memberCount} Members</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(group.invite_code); toast.success('Invite code copied!'); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-foreground bg-squad-pink"
                      style={{ boxShadow: shadowSm }}>
                      <Copy className="h-3.5 w-3.5 text-foreground" strokeWidth={2.5} />
                    </button>
                    <button onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-foreground bg-squad-pink"
                      style={{ boxShadow: shadowSm }}>
                      <Settings className="h-3.5 w-3.5 text-foreground" strokeWidth={2.5} />
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
