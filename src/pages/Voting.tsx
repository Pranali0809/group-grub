import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

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
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      setSession(sessionData);

      // Get session restaurants
      const { data: restaurants } = await supabase
        .from('session_restaurants')
        .select('*')
        .eq('session_id', sessionId);

      // Get already voted items
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('wishlist_item_id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

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
    await supabase.from('votes').insert({
      session_id: sessionId,
      user_id: user.id,
      wishlist_item_id: restaurant.wishlist_item_id,
      vote_type: voteType,
    });

    setTimeout(() => {
      setTotalVoted(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(false);
      setAnimationDir(null);
      x.set(0);

      // Check if done
      if (currentIndex + 1 >= restaurants.length) {
        checkSessionCompletion();
      }
    }, 400);
  };

  const checkSessionCompletion = async () => {
    if (!sessionId || !session) return;
    
    // Check if all members have voted on all restaurants
    const { data: allRestaurants } = await supabase
      .from('session_restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    const { data: members } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', session.group_id);

    const { data: votes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    const totalExpected = (allRestaurants as any)?.length * (members as any)?.length;
    
    if ((votes as any)?.length >= totalExpected) {
      await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId);
    }
    
    navigate(`/results/${sessionId}`);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      castVote(info.offset.x > 0 ? 'accept' : 'reject');
    }
  };

  const totalRestaurants = restaurants.length + totalVoted;
  const current = restaurants[currentIndex];

  if (!current && restaurants.length > 0 && currentIndex >= restaurants.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h2 className="font-display text-xl font-bold uppercase">Voting Complete!</h2>
        <p className="mt-2 text-muted-foreground">Waiting for other members...</p>
        <button
          onClick={() => navigate(`/results/${sessionId}`)}
          className="mt-4 rounded-xl bg-primary px-6 py-3 font-display text-sm uppercase tracking-wider text-primary-foreground"
        >
          View Results
        </button>
      </div>
    );
  }

  if (!current) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const tags = [current.cuisine_tag, current.price_range, current.highlight_tag].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader title="Squad Voting" showBack accentBg />

      {/* Progress */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-display uppercase tracking-wider text-primary">Session Progress</span>
        <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">
          {totalVoted}/{totalRestaurants} Voted
        </span>
      </div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className={`w-full max-w-sm cursor-grab rounded-2xl bg-secondary shadow-xl overflow-hidden ${
            animationDir === 'left' ? 'animate-slide-left' : 
            animationDir === 'right' ? 'animate-slide-right' : ''
          }`}
        >
          {/* Image */}
          <div className="relative h-72 w-full overflow-hidden">
            {current.restaurant_image ? (
              <img src={current.restaurant_image} alt={current.restaurant_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
            {/* Overlay tags */}
            {tags.length > 0 && (
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                {tags.map((tag, i) => (
                  <span key={i} className="rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-display uppercase text-primary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-secondary-foreground uppercase">{current.restaurant_name}</h3>
              {current.link && (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 transition-colors hover:bg-primary/30"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              )}
            </div>
            {current.cuisine_tag && (
              <p className="mt-1 text-sm text-muted-foreground">
                {[current.cuisine_tag, current.price_range, current.highlight_tag].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-8 px-6 pb-8">
        <button
          onClick={() => castVote('reject')}
          className="flex items-center gap-2 rounded-xl border-2 border-destructive px-6 py-3 font-display text-sm uppercase tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Reject
        </button>
        <button
          onClick={() => castVote('accept')}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Accept <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Voting;
