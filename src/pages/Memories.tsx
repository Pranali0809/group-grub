import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Upload, Send } from 'lucide-react';
import { toast } from 'sonner';

const shadow = '4px 4px 0px 0px hsl(0 0% 8%)';
const shadowSm = '3px 3px 0px 0px hsl(0 0% 8%)';

const Memories = () => {
  const { hangoutId } = useParams<{ hangoutId: string }>();
  const { user } = useAuth();
  const [hangout, setHangout] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!hangoutId) return;
    const fetchData = async () => {
      const { data: hangoutData } = await supabase.from('hangouts').select('*').eq('id', hangoutId).single();
      setHangout(hangoutData);
      const { data: memoriesData } = await supabase.from('memories').select('*').eq('hangout_id', hangoutId).order('created_at', { ascending: false });
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
    const { error: uploadError } = await supabase.storage.from('memory-photos').upload(filePath, file);
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('memory-photos').getPublicUrl(filePath);
    await supabase.from('memories').insert({ hangout_id: hangoutId, uploaded_by_user_id: user.id, image_url: urlData.publicUrl });
    toast.success('Memory uploaded!');
    setUploading(false);
    const { data } = await supabase.from('memories').select('*').eq('hangout_id', hangoutId).order('created_at', { ascending: false });
    setMemories(data || []);
  };

  if (!hangout) return <div className="flex min-h-screen items-center justify-center font-display text-xs uppercase">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col pb-20" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Squad Memory" showBack />

      <div className="flex-1 px-5 pt-4 space-y-4">
        {/* Hangout Info */}
        <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card" style={{ boxShadow: shadow }}>
          {hangout.restaurant_image ? (
            <div className="relative">
              <img src={hangout.restaurant_image} alt={hangout.restaurant_name} className="h-40 w-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 to-transparent p-3">
                <h2 className="font-display text-lg font-bold text-card uppercase">{hangout.restaurant_name}</h2>
                <p className="text-[9px] font-display uppercase tracking-[0.15em] text-card/80">
                  {hangout.scheduled_date} • {hangout.scheduled_time}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <h2 className="font-display text-lg font-bold uppercase text-foreground">{hangout.restaurant_name}</h2>
            </div>
          )}
          {hangout.status === 'completed' && (
            <div className="border-t-2 border-foreground p-2">
              <span className="rounded-full bg-squad-success border border-foreground px-2 py-0.5 text-[8px] font-display uppercase font-bold text-card">Completed</span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <label
          className="flex w-full cursor-pointer items-center justify-center gap-2 h-12 rounded-full border-2 border-dashed border-foreground bg-card font-display text-[11px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-squad-pink"
          style={{ boxShadow: shadowSm }}
        >
          <Upload className="h-4 w-4" strokeWidth={2.5} />
          {uploading ? 'Uploading...' : 'Upload Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>

        {/* Photo Dump */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">
            Photo Dump
            <span className="rounded-full bg-squad-pink-deep border border-foreground px-2 py-0.5 text-[8px] font-display font-bold text-foreground">
              {memories.length} Photos
            </span>
          </h3>
          {memories.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground font-display text-xs uppercase">No memories yet</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {memories.map((memory) => (
                <div key={memory.id} className="overflow-hidden rounded-xl border-2 border-foreground" style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>
                  <img src={memory.image_url} alt="" className="h-32 w-full object-cover" />
                  {memory.caption && (
                    <p className="border-t border-foreground bg-card p-1.5 text-[9px] font-display text-muted-foreground">{memory.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Talk About It */}
        <div>
          <h3 className="mb-2 text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">Talk About It</h3>
          <div className="rounded-2xl border-2 border-foreground bg-card p-3" style={{ boxShadow: shadowSm }}>
            <div className="flex gap-2">
              <div className="flex-1 rounded-full" style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>
                <Input placeholder="Add a comment to the memory..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  className="h-10 rounded-full border-2 border-foreground bg-card text-xs px-4" />
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-foreground bg-squad-pink"
                style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}>
                <Send className="h-3.5 w-3.5 text-foreground" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Memories;
