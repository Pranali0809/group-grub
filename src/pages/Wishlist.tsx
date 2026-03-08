import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import RestaurantCard from '@/components/RestaurantCard';
import { Plus, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const allCuisines = [
  'Asian', 'Italian', 'Cafe', 'Indian', 'Mexican', 'Japanese', 'American',
  'Mediterranean', 'Chinese', 'Thai', 'Korean', 'French', 'Lebanese',
  'Turkish', 'Vietnamese', 'Greek', 'Spanish', 'Ethiopian', 'Peruvian',
  'Brazilian', 'British', 'German', 'Caribbean', 'African', 'Fusion',
  'Street Food', 'Desserts', 'Bakery', 'Seafood', 'BBQ', 'Vegan',
  'Healthy', 'Fast Food', 'Pizza', 'Burger', 'Sushi', 'Ramen',
];

const priceOptions = ['Cheap', 'Medium', 'Expensive'] as const;
const highlightOptions = ['Food', 'Ambience', 'View', 'Service', 'Drinks'] as const;

const Wishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [link, setLink] = useState('');
  const [restaurantImage, setRestaurantImage] = useState('');
  const [cuisineTag, setCuisineTag] = useState('');
  const [priceCategory, setPriceCategory] = useState('');
  const [highlightTag, setHighlightTag] = useState('');
  const [customTagsInput, setCustomTagsInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cuisineSearch, setCuisineSearch] = useState('');

  const filteredCuisines = allCuisines.filter(c =>
    c.toLowerCase().includes(cuisineSearch.toLowerCase())
  );

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const resetForm = () => {
    setRestaurantName('');
    setLink('');
    setRestaurantImage('');
    setCuisineTag('');
    setPriceCategory('');
    setHighlightTag('');
    setCustomTagsInput('');
    setImageFile(null);
    setCuisineSearch('');
  };

  const handleAdd = async () => {
    if (!user || !restaurantName.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    let imageUrl = restaurantImage;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const customTags = customTagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const { error } = await supabase.from('wishlist_items').insert({
      user_id: user.id,
      restaurant_name: restaurantName.trim(),
      google_maps_link: link || null,
      restaurant_image: imageUrl || null,
      cuisine_tag: cuisineTag || null,
      price_category: priceCategory || null,
      price_range: priceCategory || null,
      highlight_tag: highlightTag || null,
      custom_tags: customTags.length > 0 ? customTags : null,
    });

    if (error) { toast.error(error.message); return; }

    toast.success('Restaurant added!');
    resetForm();
    setOpen(false);
    fetchItems();
  };

  const handleDelete = async (itemId: string) => {
    await supabase.from('wishlist_items').delete().eq('id', itemId);
    toast.success('Removed');
    fetchItems();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="My Wishlist" accentBg />

      <div className="flex-1 px-4 pt-4 space-y-3">
        {/* Add Restaurant Button */}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full rounded-xl bg-secondary text-secondary-foreground font-display uppercase tracking-wider">
              <Plus className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display uppercase">Add Restaurant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Restaurant Name *</label>
                <Input
                  placeholder="e.g. Sushi House"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>

              {/* Link */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Link (Maps, Instagram, etc.)</label>
                <Input
                  placeholder="Paste any link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              {/* Image */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Image</label>
                <Input
                  placeholder="Image URL (or upload below)"
                  value={restaurantImage}
                  onChange={(e) => setRestaurantImage(e.target.value)}
                />
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-1.5"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>

              {/* Price Category - Tabs */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Price</label>
                <div className="flex gap-2">
                  {priceOptions.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriceCategory(prev => prev === p ? '' : p)}
                      className={`flex-1 rounded-lg py-2.5 text-xs font-display uppercase tracking-wider transition-colors ${
                        priceCategory === p
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine - Searchable with chips */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Cuisine</label>
                {cuisineTag && (
                  <div className="mb-2 flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-display uppercase text-primary-foreground">
                      {cuisineTag}
                      <button type="button" onClick={() => setCuisineTag('')}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
                {!cuisineTag && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search cuisine..."
                        value={cuisineSearch}
                        onChange={(e) => setCuisineSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {filteredCuisines.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCuisineTag(c); setCuisineSearch(''); }}
                          className="rounded-full bg-secondary px-3 py-1 text-xs font-display uppercase text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          {c}
                        </button>
                      ))}
                      {cuisineSearch && filteredCuisines.length === 0 && (
                        <button
                          type="button"
                          onClick={() => { setCuisineTag(cuisineSearch); setCuisineSearch(''); }}
                          className="rounded-full bg-primary/20 px-3 py-1 text-xs font-display uppercase text-primary"
                        >
                          + Add "{cuisineSearch}"
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Highlight - Tabs */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Highlight</label>
                <div className="flex flex-wrap gap-2">
                  {highlightOptions.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHighlightTag(prev => prev === h ? '' : h)}
                      className={`rounded-lg px-4 py-2.5 text-xs font-display uppercase tracking-wider transition-colors ${
                        highlightTag === h
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-display uppercase tracking-wider text-muted-foreground">Custom Tags</label>
                <Input
                  placeholder="Comma separated (e.g. date spot, rooftop)"
                  value={customTagsInput}
                  onChange={(e) => setCustomTagsInput(e.target.value)}
                />
              </div>

              <Button onClick={handleAdd} className="w-full rounded-xl bg-primary text-primary-foreground font-display uppercase tracking-wider">
                Add to Wishlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Wishlist Items */}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Your wishlist is empty. Add some restaurants!
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <RestaurantCard
                  name={item.restaurant_name}
                  image={item.restaurant_image}
                  cuisineTag={item.cuisine_tag}
                  priceRange={item.price_range}
                  highlightTag={item.highlight_tag}
                  customTags={item.custom_tags}
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-2 top-2 rounded-full bg-destructive/80 p-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Wishlist;
