import { Home, Users, Heart, Utensils, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Squads', path: '/squads' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist' },
  { icon: Utensils, label: 'Hangouts', path: '/hangouts' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-foreground bg-card pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-foreground ${
                  isActive ? 'bg-squad-pink-deep' : 'bg-squad-pink'
                }`}
                style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}
              >
                <item.icon className="h-4 w-4 text-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-[8px] font-display uppercase tracking-[0.12em] font-bold text-foreground">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
