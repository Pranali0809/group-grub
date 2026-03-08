import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Plus, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';
const shadowSm = '2px 2px 0px 0px hsl(0 0% 8%)';

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
    const { data } = await supabase.from('wishlist_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const resetForm = () => {
    setRestaurantName(''); setLink(''); setRestaurantImage('');
    setCuisineTag(''); setPriceCategory(''); setHighlightTag('');
    setCustomTagsInput(''); setImageFile(null); setCuisineSearch('');
  };

  const handleAdd = async () => {
    if (!user || !restaurantName.trim()) { toast.error('Restaurant name is required'); return; }
    let imageUrl = restaurantImage;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('restaurant-images').upload(filePath, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('restaurant-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }
    const customTags = customTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('wishlist_items').insert({
      user_id: user.id, restaurant_name: restaurantName.trim(),
      google_maps_link: link || null, restaurant_image: imageUrl || null,
      cuisine_tag: cuisineTag || null, price_category: priceCategory || null,
      price_range: priceCategory || null, highlight_tag: highlightTag || null,
      custom_tags: customTags.length > 0 ? customTags : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Restaurant added!');
    resetForm(); setOpen(false); fetchItems();
  };

  const handleDelete = async (itemId: string) => {
    await supabase.from('wishlist_items').delete().eq('id', itemId);
    toast.success('Removed'); fetchItems();
  };

  return (
    <div className="flex min-h-screen flex-col pb-16" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="My Wishlist" />

      <div className="flex-1 px-4 pt-3 space-y-2.5">
        {/* Add Restaurant Button - dark like Figma */}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <button
              className="flex w-full items-center justify-center gap-2 h-10 rounded-full bg-secondary border-2 border-foreground font-display text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-foreground"
              style={{ boxShadow: shadow }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Add Restaurant
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto border-2 border-foreground rounded-2xl" style={{ boxShadow: '4px 4px 0px 0px hsl(0 0% 8%)' }}>
            <DialogHeader>
              <DialogTitle className="font-display text-[11px] uppercase tracking-[0.2em] font-bold">Add Restaurant</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Restaurant Name *</label>
                <div className="rounded-full" style={{ boxShadow: shadowSm }}>
                  <Input placeholder="e.g. Sushi House" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                    className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Link (Maps, Instagram, etc.)</label>
                <div className="rounded-full" style={{ boxShadow: shadowSm }}>
                  <Input placeholder="Paste any link" value={link} onChange={(e) => setLink(e.target.value)}
                    className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Image</label>
                <div className="rounded-full" style={{ boxShadow: shadowSm }}>
                  <Input placeholder="Image URL (or upload below)" value={restaurantImage} onChange={(e) => setRestaurantImage(e.target.value)}
                    className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
                </div>
                <Input type="file" accept="image/*" className="mt-2 rounded-full border-2 border-foreground text-[10px]"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>

              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Price</label>
                <div className="flex gap-1.5">
                  {priceOptions.map(p => (
                    <button key={p} type="button" onClick={() => setPriceCategory(prev => prev === p ? '' : p)}
                      className={`flex-1 rounded-full py-2 text-[9px] font-display uppercase tracking-[0.15em] font-bold border-2 border-foreground transition-colors ${
                        priceCategory === p ? 'bg-squad-pink-deep text-foreground' : 'bg-card text-foreground'
                      }`}
                      style={{ boxShadow: shadowSm }}
                    >{p}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Cuisine</label>
                {cuisineTag && (
                  <div className="mb-2 flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-squad-pink-deep border-2 border-foreground px-3 py-1 text-[9px] font-display uppercase font-bold text-foreground">
                      {cuisineTag}
                      <button type="button" onClick={() => setCuisineTag('')}><X className="h-3 w-3" /></button>
                    </span>
                  </div>
                )}
                {!cuisineTag && (
                  <>
                    <div className="relative rounded-full" style={{ boxShadow: shadowSm }}>
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search cuisine..." value={cuisineSearch} onChange={(e) => setCuisineSearch(e.target.value)}
                        className="h-10 rounded-full border-2 border-foreground bg-card pl-9 font-body text-xs" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {filteredCuisines.map(c => (
                        <button key={c} type="button" onClick={() => { setCuisineTag(c); setCuisineSearch(''); }}
                          className="rounded-full border-2 border-foreground bg-card px-2.5 py-0.5 text-[8px] font-display uppercase font-bold text-foreground hover:bg-squad-pink transition-colors"
                          style={{ boxShadow: '1px 1px 0px 0px hsl(0 0% 8%)' }}
                        >{c}</button>
                      ))}
                      {cuisineSearch && filteredCuisines.length === 0 && (
                        <button type="button" onClick={() => { setCuisineTag(cuisineSearch); setCuisineSearch(''); }}
                          className="rounded-full border-2 border-foreground bg-squad-pink px-2.5 py-0.5 text-[8px] font-display uppercase font-bold text-foreground">
                          + Add "{cuisineSearch}"
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Highlight</label>
                <div className="flex flex-wrap gap-1.5">
                  {highlightOptions.map(h => (
                    <button key={h} type="button" onClick={() => setHighlightTag(prev => prev === h ? '' : h)}
                      className={`rounded-full px-3 py-1.5 text-[9px] font-display uppercase tracking-[0.15em] font-bold border-2 border-foreground transition-colors ${
                        highlightTag === h ? 'bg-squad-pink-deep text-foreground' : 'bg-card text-foreground'
                      }`}
                      style={{ boxShadow: shadowSm }}
                    >{h}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[8px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Custom Tags</label>
                <div className="rounded-full" style={{ boxShadow: shadowSm }}>
                  <Input placeholder="Comma separated (e.g. date spot, rooftop)" value={customTagsInput} onChange={(e) => setCustomTagsInput(e.target.value)}
                    className="h-10 rounded-full border-2 border-foreground bg-card font-body text-xs px-4" />
                </div>
              </div>

              <button onClick={handleAdd}
                className="w-full h-10 rounded-full bg-squad-pink border-2 border-foreground font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground"
                style={{ boxShadow: shadow }}>
                Add to Wishlist
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Wishlist Items */}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground font-display text-[10px] uppercase tracking-[0.15em]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground font-display text-[10px] uppercase tracking-[0.15em]">Your wishlist is empty</div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border-2 border-foreground bg-card" style={{ boxShadow: shadowSm }}>
                {item.restaurant_image && (
                  <img src={item.restaurant_image} alt={item.restaurant_name} className="h-28 w-full object-cover" />
                )}
                <div className="border-t-2 border-foreground p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">{item.restaurant_name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.cuisine_tag && (
                          <span className="rounded-full bg-squad-pink border-2 border-foreground px-2 py-0.5 text-[8px] font-display uppercase font-bold text-foreground">{item.cuisine_tag}</span>
                        )}
                        {item.price_range && (
                          <span className="rounded-full bg-squad-lavender border-2 border-foreground px-2 py-0.5 text-[8px] font-display uppercase font-bold text-foreground">{item.price_range}</span>
                        )}
                      </div>
                      {item.highlight_tag && (
                        <p className="mt-1 text-[8px] font-display uppercase tracking-[0.15em] text-muted-foreground">
                          Highlight: {item.highlight_tag}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-foreground bg-squad-pink"
                      style={{ boxShadow: shadowSm }}>
                      <Trash2 className="h-3 w-3 text-foreground" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
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
