import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Trophy, Star, CalendarDays } from 'lucide-react';

const shadow = '4px 4px 0px 0px hsl(0 0% 8%)';
const shadowSm = '3px 3px 0px 0px hsl(0 0% 8%)';

type ResultItem = {
  wishlist_item_id: string; restaurant_name: string; restaurant_image: string | null;
  cuisine_tag: string | null; price_range: string | null; highlight_tag: string | null; accept_count: number;
};

const Results = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [hangoutOpen, setHangoutOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<ResultItem | null>(null);
  const [hangoutDate, setHangoutDate] = useState('');
  const [hangoutTime, setHangoutTime] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    const fetchResults = async () => {
      const { data: sessionData } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      setSession(sessionData);
      const { data: sessionRestaurants } = await supabase.from('session_restaurants').select('*').eq('session_id', sessionId);
      const { data: votes } = await supabase.from('votes').select('*').eq('session_id', sessionId).eq('vote_type', 'accept');
      const voteCounts = new Map<string, number>();
      (votes || []).forEach(v => { voteCounts.set(v.wishlist_item_id, (voteCounts.get(v.wishlist_item_id) || 0) + 1); });
      const ranked = (sessionRestaurants || []).map(r => ({
        wishlist_item_id: r.wishlist_item_id, restaurant_name: r.restaurant_name, restaurant_image: r.restaurant_image,
        cuisine_tag: r.cuisine_tag, price_range: r.price_range, highlight_tag: r.highlight_tag, accept_count: voteCounts.get(r.wishlist_item_id) || 0,
      })).sort((a, b) => b.accept_count - a.accept_count).slice(0, 5);
      setResults(ranked);
      if (sessionData) {
        const { count: memberCount } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', sessionData.group_id);
        const uniqueVoters = new Set((votes || []).map(v => v.user_id));
        setSessionInfo(`Voting ended • ${uniqueVoters.size}/${memberCount || 0} members participated`);
      }
    };
    fetchResults();
  }, [sessionId]);

  const handleCreateHangout = async () => {
    if (!user || !session || !selectedRestaurant || !hangoutDate || !hangoutTime) return;
    const { error } = await supabase.from('hangouts').insert({
      group_id: session.group_id, restaurant_name: selectedRestaurant.restaurant_name,
      restaurant_image: selectedRestaurant.restaurant_image, scheduled_date: hangoutDate,
      scheduled_time: hangoutTime, created_by_user_id: user.id,
    });
    if (error) return;
    setHangoutOpen(false); navigate('/hangouts');
  };

  const winner = results[0];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex min-h-screen flex-col pb-20" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Voting Results" showBack />
      <div className="flex-1 px-5 pt-4 space-y-4">
        {winner && (
          <div className="rounded-2xl border-2 border-foreground bg-card p-5 text-center" style={{ boxShadow: shadow }}>
            <Trophy className="mx-auto h-10 w-10 text-squad-gold" />
            <h2 className="mt-2 font-display text-2xl font-bold uppercase italic text-foreground">The Winner!</h2>
            <p className="text-[11px] font-display uppercase tracking-[0.15em] font-bold text-muted-foreground">Squad Consensus Reached</p>
            {winner.restaurant_image && (
              <div className="mt-4 overflow-hidden rounded-xl border-2 border-foreground">
                <img src={winner.restaurant_image} alt={winner.restaurant_name} className="h-36 w-full object-cover" />
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xl">🥇</span>
              <span className="font-display text-base font-bold uppercase tracking-[0.08em] text-foreground">{winner.restaurant_name}</span>
            </div>
            <p className="text-[11px] font-display uppercase tracking-[0.1em] text-muted-foreground">{winner.accept_count} Accept Votes</p>
            <button onClick={() => { setSelectedRestaurant(winner); setHangoutOpen(true); }}
              className="mt-4 flex w-full items-center justify-center gap-2 h-12 rounded-full bg-squad-lavender border-2 border-foreground font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground"
              style={{ boxShadow: shadowSm }}>
              <CalendarDays className="h-5 w-5" strokeWidth={2.5} /> Plan Hangout
            </button>
          </div>
        )}

        <div className="space-y-2">
          {results.map((item, index) => (
            <div key={item.wishlist_item_id} className="flex items-center gap-3 rounded-2xl border-2 border-foreground bg-card p-3" style={{ boxShadow: shadowSm }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-squad-pink text-base">
                {index < 3 ? medals[index] : <span className="font-display text-xs font-bold">{index + 1}</span>}
              </div>
              {item.restaurant_image && <img src={item.restaurant_image} alt="" className="h-11 w-11 rounded-lg border border-foreground object-cover" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.06em] text-foreground">{item.restaurant_name}</h3>
                <p className="text-[10px] font-display uppercase text-muted-foreground">Accept Votes</p>
              </div>
              <div className="text-right">
                <Star className="mx-auto h-5 w-5 text-squad-gold" />
                <p className="text-[11px] font-display font-bold text-foreground">{item.accept_count}</p>
              </div>
            </div>
          ))}
        </div>

        {sessionInfo && (
          <div className="rounded-2xl border-2 border-dashed border-foreground p-3 text-center" style={{ boxShadow: shadowSm }}>
            <p className="text-[11px] font-display uppercase tracking-[0.15em] font-bold text-muted-foreground">{sessionInfo}</p>
          </div>
        )}
      </div>

      <Dialog open={hangoutOpen} onOpenChange={setHangoutOpen}>
        <DialogContent className="border-2 border-foreground rounded-2xl" style={{ boxShadow: '6px 6px 0px 0px hsl(0 0% 8%)' }}>
          <DialogHeader><DialogTitle className="font-display text-base uppercase tracking-[0.15em] font-bold">Plan Hangout</DialogTitle></DialogHeader>
          <p className="font-display text-sm font-bold uppercase text-foreground">{selectedRestaurant?.restaurant_name}</p>
          <div className="rounded-full" style={{ boxShadow: shadowSm }}>
            <Input type="date" value={hangoutDate} onChange={(e) => setHangoutDate(e.target.value)} className="h-12 rounded-full border-2 border-foreground bg-card font-body text-sm px-5" />
          </div>
          <div className="rounded-full" style={{ boxShadow: shadowSm }}>
            <Input type="time" value={hangoutTime} onChange={(e) => setHangoutTime(e.target.value)} className="h-12 rounded-full border-2 border-foreground bg-card font-body text-sm px-5" />
          </div>
          <button onClick={handleCreateHangout}
            className="w-full h-12 rounded-full bg-squad-pink border-2 border-foreground font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground"
            style={{ boxShadow: shadow }}>Create Hangout</button>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
};

export default Results;
