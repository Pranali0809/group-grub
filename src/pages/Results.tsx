import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Trophy, Star, CalendarDays } from 'lucide-react';

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';
const shadowSm = '2px 2px 0px 0px hsl(0 0% 8%)';

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
    <div className="flex min-h-screen flex-col pb-16" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Voting Results" showBack />
      <div className="flex-1 px-4 pt-3 space-y-3">
        {winner && (
          <div className="rounded-2xl border-2 border-foreground bg-card p-4 text-center" style={{ boxShadow: shadow }}>
            <Trophy className="mx-auto h-8 w-8 text-squad-gold" />
            <h2 className="mt-1.5 font-display text-xl font-bold uppercase italic text-foreground">The Winner!</h2>
            <p className="text-[9px] font-display uppercase tracking-[0.2em] font-bold text-muted-foreground">Squad Consensus Reached</p>
            {winner.restaurant_image && (
              <div className="mt-3 overflow-hidden rounded-xl border-2 border-foreground">
                <img src={winner.restaurant_image} alt={winner.restaurant_name} className="h-28 w-full object-cover" />
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <span className="text-lg">🥇</span>
              <span className="font-display text-sm font-bold uppercase tracking-[0.08em] text-foreground">{winner.restaurant_name}</span>
            </div>
            <p className="text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground">{winner.accept_count} Accept Votes</p>
            <button onClick={() => { setSelectedRestaurant(winner); setHangoutOpen(true); }}
              className="mt-3 flex w-full items-center justify-center gap-2 h-10 rounded-full bg-squad-lavender border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
              style={{ boxShadow: shadowSm }}>
              <CalendarDays className="h-4 w-4" strokeWidth={2.5} /> Plan Hangout
            </button>
          </div>
        )}

        <div className="space-y-2">
          {results.map((item, index) => (
            <div key={item.wishlist_item_id} className="flex items-center gap-2.5 rounded-2xl border-2 border-foreground bg-card p-2.5" style={{ boxShadow: shadowSm }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-foreground bg-squad-pink text-sm">
                {index < 3 ? medals[index] : <span className="font-display text-[10px] font-bold">{index + 1}</span>}
              </div>
              {item.restaurant_image && <img src={item.restaurant_image} alt="" className="h-10 w-10 rounded-lg border-2 border-foreground object-cover" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.06em] text-foreground">{item.restaurant_name}</h3>
                <p className="text-[8px] font-display uppercase tracking-[0.1em] text-muted-foreground">Accept Votes</p>
              </div>
              <div className="text-right">
                <Star className="mx-auto h-4 w-4 text-squad-gold" />
                <p className="text-[10px] font-display font-bold text-foreground">{item.accept_count}</p>
              </div>
            </div>
          ))}
        </div>

        {sessionInfo && (
          <div className="rounded-2xl border-2 border-dashed border-foreground p-2.5 text-center" style={{ boxShadow: shadowSm }}>
            <p className="text-[9px] font-display uppercase tracking-[0.2em] font-bold text-muted-foreground">{sessionInfo}</p>
          </div>
        )}
      </div>

      <Dialog open={hangoutOpen} onOpenChange={setHangoutOpen}>
        <DialogContent className="border-2 border-foreground rounded-2xl" style={{ boxShadow: '4px 4px 0px 0px hsl(0 0% 8%)' }}>
          <DialogHeader><DialogTitle className="font-display text-[11px] uppercase tracking-[0.2em] font-bold">Plan Hangout</DialogTitle></DialogHeader>
          <p className="font-display text-[11px] font-bold uppercase text-foreground">{selectedRestaurant?.restaurant_name}</p>
          <div className="rounded-full" style={{ boxShadow: shadowSm }}>
            <Input type="date" value={hangoutDate} onChange={(e) => setHangoutDate(e.target.value)} className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
          </div>
          <div className="rounded-full" style={{ boxShadow: shadowSm }}>
            <Input type="time" value={hangoutTime} onChange={(e) => setHangoutTime(e.target.value)} className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
          </div>
          <button onClick={handleCreateHangout}
            className="w-full h-10 rounded-full bg-squad-pink border-2 border-foreground font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
            style={{ boxShadow: shadow }}>Create Hangout</button>
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
};

export default Results;
