import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { format, isPast, parseISO } from 'date-fns';
import { Users, Calendar, Edit, ImagePlus, Eye } from 'lucide-react';

const Hangouts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hangouts, setHangouts] = useState<any[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHangouts = async () => {
      // Get user's group IDs
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setHangouts([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);
      const { data } = await supabase
        .from('hangouts')
        .select('*')
        .in('group_id', groupIds)
        .order('scheduled_date', { ascending: true });
      
      // Fetch profiles for creators
      const creatorIds = [...new Set((data || []).map(h => h.created_by_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', creatorIds);
      
      // Combine data
      const hangoutsWithProfiles = (data || []).map(h => ({
        ...h,
        profiles: profiles?.find(p => p.user_id === h.created_by_user_id) || null
      }));

      // Auto-complete past hangouts
      const updated = await Promise.all(
        hangoutsWithProfiles.map(async (h) => {
          const hangoutDate = parseISO(`${h.scheduled_date}T${h.scheduled_time}`);
          if (isPast(hangoutDate) && h.status === 'upcoming') {
            await supabase.from('hangouts').update({ status: 'completed' }).eq('id', h.id);
            return { ...h, status: 'completed' };
          }
          return h;
        })
      );

      setHangouts(updated);
      setLoading(false);
    };
    fetchHangouts();
  }, [user]);

  const upcoming = hangouts.filter(h => h.status === 'upcoming');
  const completed = hangouts.filter(h => h.status === 'completed');
  const displayed = tab === 'upcoming' ? upcoming : completed;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="Hangouts" accentBg />

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-3">
        <button
          onClick={() => setTab('upcoming')}
          className={`rounded-full px-4 py-1.5 font-display text-xs uppercase tracking-wider transition-colors ${
            tab === 'upcoming' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab('history')}
          className={`rounded-full px-4 py-1.5 font-display text-xs uppercase tracking-wider transition-colors ${
            tab === 'history' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          History
        </button>
      </div>

      <div className="flex-1 px-4 pt-3 space-y-3">
        {tab === 'upcoming' && (
          <h2 className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-squad-success" />
            Upcoming Hangouts
          </h2>
        )}
        {tab === 'history' && (
          <h2 className="text-xs font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Completed
          </h2>
        )}

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No {tab === 'upcoming' ? 'upcoming' : 'completed'} hangouts
          </div>
        ) : (
          displayed.map((hangout) => (
            <div key={hangout.id} className="overflow-hidden rounded-xl bg-card">
              {hangout.restaurant_image ? (
                <img src={hangout.restaurant_image} alt={hangout.restaurant_name} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-muted">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase">{hangout.restaurant_name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(hangout.scheduled_date), 'MMM d, yyyy')} • {hangout.scheduled_time}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Hosted by {(hangout.profiles as any)?.name || 'Unknown'}
                    </p>
                  </div>
                  {hangout.status === 'completed' && (
                    <span className="rounded-full bg-squad-success/20 px-2 py-0.5 text-[10px] font-display uppercase text-squad-success">
                      Done
                    </span>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  {hangout.status === 'upcoming' && (
                    <>
                      <button className="flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1.5 text-[10px] font-display uppercase text-primary">
                        <Users className="h-3 w-3" /> People
                      </button>
                      <button
                        onClick={() => navigate(`/hangouts/${hangout.id}/edit`)}
                        className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[10px] font-display uppercase text-muted-foreground"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                    </>
                  )}
                  {hangout.status === 'completed' && (
                    <>
                      <button
                        onClick={() => navigate(`/hangouts/${hangout.id}/memories`)}
                        className="flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1.5 text-[10px] font-display uppercase text-primary"
                      >
                        <ImagePlus className="h-3 w-3" /> Add Memory
                      </button>
                      <button
                        onClick={() => navigate(`/hangouts/${hangout.id}/memories`)}
                        className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[10px] font-display uppercase text-muted-foreground"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
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
