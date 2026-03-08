import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import RestaurantCard from '@/components/RestaurantCard';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const cuisineOptions = ['Asian', 'Italian', 'Cafe', 'Indian', 'Mexican', 'Japanese', 'American', 'Mediterranean'];
const priceCategoryOptions = ['Cheap', 'Medium', 'Expensive'];
const highlightOptions = ['Food', 'Ambience', 'View', 'Service', 'Drinks'];

const Wishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [restaurantImage, setRestaurantImage] = useState('');
  const [cuisineTag, setCuisineTag] = useState('');
  const [priceCategory, setPriceCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [highlightTag, setHighlightTag] = useState('');
  const [customTagsInput, setCustomTagsInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

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
    setGoogleMapsLink('');
    setRestaurantImage('');
    setCuisineTag('');
    setPriceCategory('');
    setPriceRange('');
    setHighlightTag('');
    setCustomTagsInput('');
    setImageFile(null);
  };

  const handleAdd = async () => {
    if (!user || !restaurantName.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    let imageUrl = restaurantImage;

    // Upload image if provided
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
      google_maps_link: googleMapsLink || null,
      restaurant_image: imageUrl || null,
      cuisine_tag: cuisineTag || null,
      price_category: priceCategory || null,
      price_range: priceRange || null,
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
        <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="space-y-3">
              <Input
                placeholder="Restaurant Name *"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
              <Input
                placeholder="Google Maps Link"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
              />
              <Input
                placeholder="Image URL (or upload below)"
                value={restaurantImage}
                onChange={(e) => setRestaurantImage(e.target.value)}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <Select value={cuisineTag} onValueChange={setCuisineTag}>
                <SelectTrigger><SelectValue placeholder="Cuisine" /></SelectTrigger>
                <SelectContent>
                  {cuisineOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priceCategory} onValueChange={setPriceCategory}>
                <SelectTrigger><SelectValue placeholder="Price Category" /></SelectTrigger>
                <SelectContent>
                  {priceCategoryOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Price Range (e.g. ₹300-₹500)"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              />
              <Select value={highlightTag} onValueChange={setHighlightTag}>
                <SelectTrigger><SelectValue placeholder="Highlight" /></SelectTrigger>
                <SelectContent>
                  {highlightOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Custom tags (comma separated)"
                value={customTagsInput}
                onChange={(e) => setCustomTagsInput(e.target.value)}
              />
              <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground font-display uppercase">
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
