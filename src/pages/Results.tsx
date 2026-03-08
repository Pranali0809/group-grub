import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Trophy, Medal, Star, CalendarDays } from 'lucide-react';

type ResultItem = {
  wishlist_item_id: string;
  restaurant_name: string;
  restaurant_image: string | null;
  cuisine_tag: string | null;
  price_range: string | null;
  highlight_tag: string | null;
  accept_count: number;
};

const medals = [
  { icon: '🥇', color: 'bg-squad-gold/20 border-squad-gold' },
  { icon: '🥈', color: 'bg-squad-silver/20 border-squad-silver' },
  { icon: '🥉', color: 'bg-squad-bronze/20 border-squad-bronze' },
];

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
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      setSession(sessionData);

      // Get all session restaurants
      const { data: sessionRestaurants } = await supabase
        .from('session_restaurants')
        .select('*')
        .eq('session_id', sessionId);

      // Get all accept votes
      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('vote_type', 'accept');

      // Count votes per restaurant
      const voteCounts = new Map<string, number>();
      (votes || []).forEach(v => {
        voteCounts.set(v.wishlist_item_id, (voteCounts.get(v.wishlist_item_id) || 0) + 1);
      });

      const ranked = (sessionRestaurants || [])
        .map(r => ({
          wishlist_item_id: r.wishlist_item_id,
          restaurant_name: r.restaurant_name,
          restaurant_image: r.restaurant_image,
          cuisine_tag: r.cuisine_tag,
          price_range: r.price_range,
          highlight_tag: r.highlight_tag,
          accept_count: voteCounts.get(r.wishlist_item_id) || 0,
        }))
        .sort((a, b) => b.accept_count - a.accept_count)
        .slice(0, 5);

      setResults(ranked);

      // Get member/vote info
      if (sessionData) {
        const { count: memberCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', sessionData.group_id);
        
        const uniqueVoters = new Set((votes || []).map(v => v.user_id));
        setSessionInfo(`Voting ended • ${uniqueVoters.size}/${memberCount || 0} members participated`);
      }
    };
    fetchResults();
  }, [sessionId]);

  const handleCreateHangout = async () => {
    if (!user || !session || !selectedRestaurant || !hangoutDate || !hangoutTime) return;
    
    const { error } = await supabase.from('hangouts').insert({
      group_id: session.group_id,
      restaurant_name: selectedRestaurant.restaurant_name,
      restaurant_image: selectedRestaurant.restaurant_image,
      scheduled_date: hangoutDate,
      scheduled_time: hangoutTime,
      created_by_user_id: user.id,
    });

    if (error) return;
    setHangoutOpen(false);
    navigate('/hangouts');
  };

  const winner = results[0];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="Voting Results" showBack accentBg />

      <div className="flex-1 px-4 pt-4 space-y-4">
        {/* Winner */}
        {winner && (
          <div className="rounded-2xl bg-card p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-squad-gold" />
            <h2 className="mt-2 font-display text-2xl font-bold uppercase">The Winner!</h2>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Squad Consensus Reached</p>
            
            {winner.restaurant_image && (
              <div className="mt-4 overflow-hidden rounded-xl">
                <img src={winner.restaurant_image} alt={winner.restaurant_name} className="h-32 w-full object-cover" />
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-lg">🥇</span>
              <span className="font-display text-lg font-bold uppercase">{winner.restaurant_name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{winner.accept_count} Accept Votes</p>

            <Button
              onClick={() => {
                setSelectedRestaurant(winner);
                setHangoutOpen(true);
              }}
              className="mt-4 w-full rounded-xl bg-secondary text-secondary-foreground font-display uppercase tracking-wider"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Plan Hangout
            </Button>
          </div>
        )}

        {/* Rankings */}
        <div className="space-y-2">
          {results.map((item, index) => {
            const medal = medals[index];
            const tags = [item.cuisine_tag, item.price_range, item.highlight_tag].filter(Boolean);
            return (
              <div
                key={item.wishlist_item_id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  medal ? medal.color : 'bg-card border-border'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-lg">
                  {medal ? medal.icon : <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>}
                </div>
                {item.restaurant_image && (
                  <img src={item.restaurant_image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold uppercase">{item.restaurant_name}</h3>
                  {tags.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">{tags.join(' • ')}</p>
                  )}
                </div>
                <div className="text-right">
                  <Star className="mx-auto h-4 w-4 text-squad-gold" />
                  <p className="text-[10px] text-muted-foreground">{item.accept_count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="rounded-xl border border-dashed border-border p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{sessionInfo}</p>
          </div>
        )}
      </div>

      {/* Hangout Dialog */}
      <Dialog open={hangoutOpen} onOpenChange={setHangoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display uppercase">Plan Hangout</DialogTitle>
          </DialogHeader>
          <p className="text-sm">{selectedRestaurant?.restaurant_name}</p>
          <Input type="date" value={hangoutDate} onChange={(e) => setHangoutDate(e.target.value)} />
          <Input type="time" value={hangoutTime} onChange={(e) => setHangoutTime(e.target.value)} />
          <Button onClick={handleCreateHangout} className="w-full bg-primary text-primary-foreground font-display uppercase">
            Create Hangout
          </Button>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Results;
