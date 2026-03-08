import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

const shadow = '4px 4px 0px 0px hsl(0 0% 8%)';

const Voting = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalVoted, setTotalVoted] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDir, setAnimationDir] = useState<'left' | 'right' | null>(null);
  const [session, setSession] = useState<any>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  useEffect(() => {
    if (!sessionId || !user) return;
    const fetchData = async () => {
      const { data: sessionData } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      setSession(sessionData);
      const { data: restaurants } = await supabase.from('session_restaurants').select('*').eq('session_id', sessionId);
      const { data: existingVotes } = await supabase.from('votes').select('wishlist_item_id').eq('session_id', sessionId).eq('user_id', user.id);
      const votedIds = new Set((existingVotes || []).map(v => v.wishlist_item_id));
      const remaining = (restaurants || []).filter(r => !votedIds.has(r.wishlist_item_id));
      setRestaurants(remaining);
      setTotalVoted(votedIds.size);
    };
    fetchData();
  }, [sessionId, user]);

  const castVote = async (voteType: 'accept' | 'reject') => {
    if (!user || !sessionId || currentIndex >= restaurants.length || isAnimating) return;
    setIsAnimating(true);
    setAnimationDir(voteType === 'accept' ? 'right' : 'left');
    const restaurant = restaurants[currentIndex];
    await supabase.from('votes').insert({ session_id: sessionId, user_id: user.id, wishlist_item_id: restaurant.wishlist_item_id, vote_type: voteType });
    setTimeout(() => {
      setTotalVoted(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false); setAnimationDir(null); x.set(0);
      if (currentIndex + 1 >= restaurants.length) navigate(`/results/${sessionId}`);
    }, 400);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) castVote(info.offset.x > 0 ? 'accept' : 'reject');
  };

  const totalRestaurants = restaurants.length + totalVoted;
  const current = restaurants[currentIndex];

  if (!current && restaurants.length > 0 && currentIndex >= restaurants.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
        <h2 className="font-display text-2xl font-bold uppercase italic text-foreground">Voting Complete!</h2>
        <p className="mt-2 text-xs font-display uppercase tracking-[0.15em] text-muted-foreground">Waiting for other members...</p>
        <button onClick={() => navigate(`/results/${sessionId}`)}
          className="mt-6 rounded-full bg-squad-pink border-2 border-foreground px-8 py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground"
          style={{ boxShadow: shadow }}>View Results</button>
      </div>
    );
  }

  if (!current) return <div className="flex min-h-screen items-center justify-center font-display text-sm uppercase">Loading...</div>;

  const tags = [current.cuisine_tag, current.price_range, current.highlight_tag].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Squad Voting" showBack />

      {/* Progress */}
      <div className="flex items-center justify-between px-5 py-2">
        <span className="text-[11px] font-display uppercase tracking-[0.15em] font-bold text-foreground">Session Progress</span>
        <span className="text-[11px] font-display uppercase tracking-[0.15em] font-bold text-muted-foreground">{totalVoted}/{totalRestaurants} Voted</span>
      </div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-5">
        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className={`w-full max-w-sm cursor-grab ${
            animationDir === 'left' ? 'animate-slide-left' : animationDir === 'right' ? 'animate-slide-right' : ''
          }`}
        >
          <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card" style={{ boxShadow: '6px 6px 0px 0px hsl(0 0% 8%)' }}>
            <div className="relative h-72 w-full overflow-hidden">
              {current.restaurant_image ? (
                <img src={current.restaurant_image} alt={current.restaurant_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted"><span className="text-6xl">🍽️</span></div>
              )}
              {tags.length > 0 && (
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                  {tags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-squad-pink border border-foreground px-2.5 py-1 text-[10px] font-display uppercase font-bold text-foreground">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-foreground bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-foreground uppercase">{current.restaurant_name}</h3>
                {current.link && (
                  <a href={current.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-foreground bg-squad-pink"
                    style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>
                    <ExternalLink className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                  </a>
                )}
              </div>
              {current.cuisine_tag && (
                <p className="mt-1 text-[11px] font-display uppercase tracking-[0.1em] text-muted-foreground">
                  {[current.cuisine_tag, current.price_range, current.highlight_tag].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-4 px-5 pb-6 pt-4">
        <button onClick={() => castVote('reject')}
          className="flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.1em] text-foreground"
          style={{ boxShadow: shadow }}>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} /> Reject
        </button>
        <button onClick={() => castVote('accept')}
          className="flex items-center gap-2 rounded-full border-2 border-foreground bg-squad-pink px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.1em] text-foreground"
          style={{ boxShadow: shadow }}>
          Accept <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default Voting;
