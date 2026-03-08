import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';

const shadow = '4px 4px 0px 0px hsl(0 0% 8%)';
const shadowSm = '3px 3px 0px 0px hsl(0 0% 8%)';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      setProfile(data); setName(data?.name || '');
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ name }).eq('user_id', user.id);
    toast.success('Profile updated!'); setSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col pb-20" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Profile" />
      <div className="flex-1 px-5 pt-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground bg-squad-pink font-display text-2xl font-bold text-foreground"
            style={{ boxShadow: shadow }}>{name?.charAt(0)?.toUpperCase() || '?'}</div>
          <p className="mt-3 text-[11px] font-display uppercase tracking-[0.15em] text-muted-foreground">{user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-display uppercase tracking-[0.15em] font-bold text-foreground">Name</label>
            <div className="rounded-full" style={{ boxShadow: shadowSm }}>
              <Input value={name} onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-full border-2 border-foreground bg-card font-body text-sm px-5" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex w-full items-center justify-center gap-2 h-14 rounded-full bg-squad-pink border-2 border-foreground font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground disabled:opacity-50"
            style={{ boxShadow: shadow }}>
            <Save className="h-5 w-5" strokeWidth={2.5} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <button onClick={signOut}
          className="flex w-full items-center justify-center gap-2 h-14 rounded-full bg-card border-2 border-foreground font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground"
          style={{ boxShadow: shadow }}>
          <LogOut className="h-5 w-5" strokeWidth={2.5} /> Sign Out
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
