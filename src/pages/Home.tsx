import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import { Users, Heart, Utensils } from 'lucide-react';

const quickActions = [
  { icon: Users, label: 'My Squads', path: '/squads', color: 'bg-primary/20 text-primary' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist', color: 'bg-squad-gold/20 text-squad-gold' },
  { icon: Utensils, label: 'Hangouts', path: '/hangouts', color: 'bg-squad-success/20 text-squad-success' },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-bold text-primary-foreground uppercase tracking-wider">Squad Memory</h1>
          <p className="text-xs text-primary-foreground/80">Where squads decide what to eat</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold text-primary-foreground">
          {user?.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 rounded-xl bg-card p-5 transition-transform active:scale-95"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="font-display text-xs font-bold uppercase tracking-wider">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Welcome Message */}
        <div className="rounded-xl bg-card p-4 text-center">
          <h2 className="font-display text-lg font-bold uppercase">Ready to Plan?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a squad, add restaurants to your wishlist, and vote on where to eat next!
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
