import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Camera, Upload, Send } from 'lucide-react';
import { toast } from 'sonner';

const Memories = () => {
  const { hangoutId } = useParams<{ hangoutId: string }>();
  const { user } = useAuth();
  const [hangout, setHangout] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!hangoutId) return;
    const fetchData = async () => {
      const { data: hangoutData } = await supabase
        .from('hangouts')
        .select('*')
        .eq('id', hangoutId)
        .single();
      setHangout(hangoutData);

      const { data: memoriesData } = await supabase
        .from('memories')
        .select('*, profiles:uploaded_by_user_id(name, profile_image)')
        .eq('hangout_id', hangoutId)
        .order('created_at', { ascending: false });
      setMemories(memoriesData || []);
    };
    fetchData();
  }, [hangoutId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !hangoutId) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${hangoutId}/${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('memory-photos')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('memory-photos').getPublicUrl(filePath);

    await supabase.from('memories').insert({
      hangout_id: hangoutId,
      uploaded_by_user_id: user.id,
      image_url: urlData.publicUrl,
    });

    toast.success('Memory uploaded!');
    setUploading(false);

    // Refresh
    const { data } = await supabase
      .from('memories')
      .select('*, profiles:uploaded_by_user_id(name, profile_image)')
      .eq('hangout_id', hangoutId)
      .order('created_at', { ascending: false });
    setMemories(data || []);
  };

  if (!hangout) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader title="Squad Memory" showBack accentBg />

      <div className="flex-1 px-4 pt-4 space-y-4">
        {/* Hangout Info */}
        <div className="rounded-xl bg-card overflow-hidden">
          {hangout.restaurant_image && (
            <div className="relative">
              <img src={hangout.restaurant_image} alt={hangout.restaurant_name} className="h-40 w-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/80 to-transparent p-3">
                <h2 className="font-display text-xl font-bold text-secondary-foreground uppercase">{hangout.restaurant_name}</h2>
                <p className="text-xs text-muted-foreground">
                  {hangout.scheduled_date} • {hangout.scheduled_time}
                </p>
              </div>
            </div>
          )}
          {hangout.status === 'completed' && (
            <span className="m-3 inline-block rounded-full bg-squad-success/20 px-2 py-0.5 text-[10px] font-display uppercase text-squad-success">
              Completed
            </span>
          )}
        </div>

        {/* Upload Button */}
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-4 transition-colors hover:border-primary">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {/* Photo Dump */}
        <div>
          <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
            Photo Dump <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{memories.length} Photos</span>
          </h3>
          
          {memories.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              No memories yet. Upload some photos!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {memories.map((memory) => (
                <div key={memory.id} className="overflow-hidden rounded-xl">
                  <img src={memory.image_url} alt="" className="h-32 w-full object-cover" />
                  {memory.caption && (
                    <p className="bg-card p-1.5 text-[10px] text-muted-foreground">{memory.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Talk About It */}
        <div>
          <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
            Talk About It
          </h3>
          <div className="rounded-xl bg-card p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment to the memory..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs"
              />
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Memories;
