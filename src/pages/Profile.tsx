import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      setProfile(data);
      setName(data?.name || '');
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ name }).eq('user_id', user.id);
    toast.success('Profile updated!');
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="Profile" />

      <div className="flex-1 px-4 pt-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground font-display uppercase">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full font-display uppercase tracking-wider text-destructive border-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
