import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';
const shadowSm = '2px 2px 0px 0px hsl(0 0% 8%)';

const EditHangout = () => {
  const { hangoutId } = useParams<{ hangoutId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hangout, setHangout] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hangoutId) return;
    supabase.from('hangouts').select('*').eq('id', hangoutId).single().then(({ data }) => {
      if (data) {
        setHangout(data);
        setRestaurantName(data.restaurant_name);
        setScheduledDate(data.scheduled_date);
        setScheduledTime(data.scheduled_time);
      }
    });
  }, [hangoutId]);

  const handleSave = async () => {
    if (!hangoutId || !restaurantName.trim() || !scheduledDate || !scheduledTime) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('hangouts').update({
      restaurant_name: restaurantName.trim(),
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
    }).eq('id', hangoutId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Hangout updated!');
    navigate('/hangouts');
  };

  const handleCancel = async () => {
    if (!hangoutId) return;
    await supabase.from('hangouts').update({ status: 'cancelled' }).eq('id', hangoutId);
    toast.success('Hangout cancelled');
    navigate('/hangouts');
  };

  if (!hangout) return <div className="flex min-h-screen items-center justify-center font-display text-[10px] uppercase tracking-[0.2em]">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col pb-16" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Edit Hangout" showBack />

      <div className="flex-1 px-4 pt-4 space-y-4">
        <div className="rounded-2xl border-2 border-foreground bg-card p-4 space-y-3" style={{ boxShadow: shadow }}>
          <div>
            <label className="mb-1.5 block text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Restaurant Name</label>
            <div className="rounded-full" style={{ boxShadow: shadowSm }}>
              <Input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Date</label>
            <div className="rounded-full" style={{ boxShadow: shadowSm }}>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Time</label>
            <div className="rounded-full" style={{ boxShadow: shadowSm }}>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-full bg-squad-mint border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground disabled:opacity-50"
          style={{ boxShadow: shadow }}>
          <Save className="h-4 w-4" strokeWidth={2.5} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button onClick={handleCancel}
          className="flex w-full items-center justify-center gap-2 h-11 rounded-full bg-card border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-destructive"
          style={{ boxShadow: shadow }}>
          <Trash2 className="h-4 w-4" strokeWidth={2.5} /> Cancel Hangout
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default EditHangout;
