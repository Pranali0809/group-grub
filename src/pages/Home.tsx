import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import { Users, Heart, Utensils, Sparkles } from 'lucide-react';

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';

const quickActions = [
  { icon: Users, label: 'My Squads', path: '/squads', bg: 'bg-squad-pink' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist', bg: 'bg-squad-lavender' },
  { icon: Utensils, label: 'Hangouts', path: '/hangouts', bg: 'bg-squad-pink' },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col pb-16" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Squad Memory" leftIcon={<Sparkles className="h-4 w-4 text-foreground" strokeWidth={2.5} />} />

      <div className="flex-1 px-4 pt-4 space-y-4">
        <div className="rounded-2xl border-2 border-foreground bg-card p-5 text-center" style={{ boxShadow: shadow }}>
          <h2 className="font-display text-2xl font-bold uppercase italic text-foreground leading-none">Ready to Plan?</h2>
          <div className="mt-2.5 mb-1.5 mx-auto w-32 border-t-2 border-foreground" />
          <p className="text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Where squads decide what to eat</p>
        </div>

        <div className="space-y-2.5">
          {quickActions.map((action) => (
            <button key={action.path} onClick={() => navigate(action.path)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 border-foreground ${action.bg} p-3.5 text-left active:scale-[0.98] transition-transform`}
              style={{ boxShadow: shadow }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-foreground bg-card"
                style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>
                <action.icon className="h-4 w-4 text-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
