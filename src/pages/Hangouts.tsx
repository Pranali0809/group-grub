import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { format, isPast, parseISO } from 'date-fns';
import { Users, Calendar, Edit, ImagePlus, Eye, Sparkles } from 'lucide-react';

const shadow = '4px 4px 0px 0px hsl(0 0% 8%)';
const shadowSm = '3px 3px 0px 0px hsl(0 0% 8%)';

const Hangouts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hangouts, setHangouts] = useState<any[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHangouts = async () => {
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
      if (!memberships || memberships.length === 0) { setHangouts([]); setLoading(false); return; }
      const groupIds = memberships.map(m => m.group_id);
      const { data } = await supabase.from('hangouts').select('*').in('group_id', groupIds).order('scheduled_date', { ascending: true });
      const creatorIds = [...new Set((data || []).map(h => h.created_by_user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', creatorIds);
      const hangoutsWithProfiles = (data || []).map(h => ({ ...h, profiles: profiles?.find(p => p.user_id === h.created_by_user_id) || null }));
      const updated = await Promise.all(hangoutsWithProfiles.map(async (h) => {
        const hangoutDate = parseISO(`${h.scheduled_date}T${h.scheduled_time}`);
        if (isPast(hangoutDate) && h.status === 'upcoming') {
          await supabase.from('hangouts').update({ status: 'completed' }).eq('id', h.id);
          return { ...h, status: 'completed' };
        }
        return h;
      }));
      setHangouts(updated); setLoading(false);
    };
    fetchHangouts();
  }, [user]);

  const upcoming = hangouts.filter(h => h.status === 'upcoming');
  const completed = hangouts.filter(h => h.status === 'completed');
  const displayed = tab === 'upcoming' ? upcoming : completed;

  return (
    <div className="flex min-h-screen flex-col pb-20" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Hangouts" leftIcon={<Sparkles className="h-5 w-5 text-foreground" strokeWidth={2.5} />} />

      <div className="flex gap-2 px-5 pt-3">
        <button onClick={() => setTab('upcoming')}
          className={`rounded-full px-5 py-2.5 font-display text-xs uppercase tracking-[0.15em] font-bold border-2 border-foreground ${
            tab === 'upcoming' ? 'bg-squad-pink-deep' : 'bg-card'
          } text-foreground`} style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>Upcoming</button>
        <button onClick={() => setTab('history')}
          className={`rounded-full px-5 py-2.5 font-display text-xs uppercase tracking-[0.15em] font-bold border-2 border-foreground ${
            tab === 'history' ? 'bg-squad-pink-deep' : 'bg-card'
          } text-foreground`} style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>History</button>
      </div>

      <div className="flex-1 px-5 pt-3 space-y-3">
        <h2 className="text-[11px] font-display uppercase tracking-[0.15em] font-bold text-foreground flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${tab === 'upcoming' ? 'bg-squad-success' : 'bg-muted-foreground'}`} />
          {tab === 'upcoming' ? 'Upcoming Hangouts' : 'Completed'}
        </h2>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground font-display text-sm uppercase">Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground font-display text-sm uppercase">
            No {tab === 'upcoming' ? 'upcoming' : 'completed'} hangouts
          </div>
        ) : (
          displayed.map((hangout) => (
            <div key={hangout.id} className="overflow-hidden rounded-2xl border-2 border-foreground bg-card" style={{ boxShadow: shadowSm }}>
              {hangout.restaurant_image ? (
                <img src={hangout.restaurant_image} alt={hangout.restaurant_name} className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-muted"><span className="text-4xl">🍽️</span></div>
              )}
              <div className="border-t-2 border-foreground p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">{hangout.restaurant_name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-display uppercase tracking-[0.06em] text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(hangout.scheduled_date), 'MMM d, yyyy')} • {hangout.scheduled_time}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-display uppercase tracking-[0.06em] text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> Hosted by {(hangout.profiles as any)?.name || 'Unknown'}
                    </p>
                  </div>
                  {hangout.status === 'completed' && (
                    <span className="rounded-full bg-squad-success border border-foreground px-2.5 py-1 text-[10px] font-display uppercase font-bold text-card">Done</span>
                  )}
                </div>
                <div className="mt-2.5 flex gap-2">
                  {hangout.status === 'upcoming' && (
                    <>
                      <button className="flex items-center gap-1 rounded-full border-2 border-foreground bg-squad-pink px-3.5 py-2 text-[10px] font-display uppercase font-bold text-foreground"
                        style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}><Users className="h-3.5 w-3.5" /> People</button>
                      <button onClick={() => navigate(`/hangouts/${hangout.id}/edit`)}
                        className="flex items-center gap-1 rounded-full border-2 border-foreground bg-squad-lavender px-3.5 py-2 text-[10px] font-display uppercase font-bold text-foreground"
                        style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}><Edit className="h-3.5 w-3.5" /> Edit</button>
                    </>
                  )}
                  {hangout.status === 'completed' && (
                    <>
                      <button onClick={() => navigate(`/hangouts/${hangout.id}/memories`)}
                        className="flex items-center gap-1 rounded-full border-2 border-foreground bg-squad-pink px-3.5 py-2 text-[10px] font-display uppercase font-bold text-foreground"
                        style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}><ImagePlus className="h-3.5 w-3.5" /> Add Memory</button>
                      <button onClick={() => navigate(`/hangouts/${hangout.id}/memories`)}
                        className="flex items-center gap-1 rounded-full border-2 border-foreground bg-squad-lavender px-3.5 py-2 text-[10px] font-display uppercase font-bold text-foreground"
                        style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}><Eye className="h-3.5 w-3.5" /> View</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Hangouts;
