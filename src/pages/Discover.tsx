import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Discover = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="Discover" />

      <div className="flex-1 px-4 pt-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search restaurants..." className="pl-10 rounded-xl" />
        </div>

        <div className="py-12 text-center">
          <p className="text-muted-foreground">Discover restaurants from your squad members' wishlists</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Discover;
