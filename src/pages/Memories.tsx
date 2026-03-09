import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const shadow = '3px 3px 0px 0px hsl(0 0% 8%)';
const shadowSm = '2px 2px 0px 0px hsl(0 0% 8%)';

const commentColors = [
  'bg-squad-pink',
  'bg-squad-mint',
  'bg-squad-yellow',
  'bg-squad-peach',
  'bg-squad-lavender',
];

const photoTagColors = [
  'bg-squad-mint',
  'bg-squad-pink',
  'bg-squad-yellow',
  'bg-squad-peach',
  'bg-squad-lavender',
];

const Memories = () => {
  const { hangoutId } = useParams<{ hangoutId: string }>();
  const { user } = useAuth();
  const [hangout, setHangout] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState<{ name: string; text: string }[]>([
    { name: 'Amara', text: 'Best burger in the city hands down. We gotta come back next month!' },
    { name: 'Sunny B', text: 'The milkshakes were 10/10. Look at my sugar rush in that photo lol' },
  ]);

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

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, { name: 'You', text: newComment.trim() }]);
    setNewComment('');
  };

  if (!hangout) return <div className="flex min-h-screen items-center justify-center font-display text-[10px] uppercase tracking-[0.2em]">Loading...</div>;

  const tagLabels = ['SWEET', 'YUMMY', 'VIBES', 'FIRE', 'COZY'];

  return (
    <div className="flex min-h-screen flex-col pb-20" style={{ backgroundColor: 'hsl(348 60% 95%)' }}>
      <PageHeader title="Squad Memory" showBack />

      <div className="flex-1 px-4 pt-3 space-y-3">
        {/* Hangout Info Card */}
        <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card" style={{ boxShadow: shadow }}>
          {hangout.restaurant_image ? (
            <img src={hangout.restaurant_image} alt={hangout.restaurant_name} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 w-full items-center justify-center bg-muted"><span className="text-4xl">🍽️</span></div>
          )}
          <div className="border-t-2 border-foreground p-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-[0.05em] text-foreground">{hangout.restaurant_name}</h2>
                <p className="mt-0.5 text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground">
                  {hangout.scheduled_date && format(parseISO(hangout.scheduled_date), 'EEEE, MMM d')} • {hangout.scheduled_time}
                </p>
              </div>
              {hangout.status === 'completed' && (
                <span className="rounded-full bg-squad-success border-2 border-foreground px-2.5 py-0.5 text-[8px] font-display uppercase font-bold text-card">Completed</span>
              )}
            </div>
          </div>
        </div>

        {/* Upload Photo Button */}
        <label
          className="flex w-full cursor-pointer items-center justify-center gap-2 h-11 rounded-full border-2 border-foreground bg-card font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-squad-yellow"
          style={{ boxShadow: shadow }}
        >
          <Upload className="h-4 w-4" strokeWidth={2.5} />
          {uploading ? 'Uploading...' : 'Upload Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>

        {/* Photo Dump Section */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] font-bold text-foreground">
            Photo Dump
            <span className="rounded-full bg-squad-peach border-2 border-foreground px-2.5 py-0.5 text-[8px] font-display font-bold text-foreground">
              {memories.length} Photos
            </span>
          </h3>
          {memories.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground font-display text-[10px] uppercase tracking-[0.15em]">No memories yet — upload the first one!</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {memories.map((memory, idx) => (
                <div key={memory.id} className="overflow-hidden rounded-xl border-2 border-foreground bg-card" style={{ boxShadow: shadowSm }}>
                  <img src={memory.image_url} alt="" className="h-32 w-full object-cover" />
                  <div className="border-t-2 border-foreground p-1.5">
                    <span className={`rounded-full ${photoTagColors[idx % photoTagColors.length]} border border-foreground px-2 py-0.5 text-[7px] font-display uppercase font-bold text-foreground`}>
                      {memory.caption || tagLabels[idx % tagLabels.length]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Talk About It Section */}
        <div>
          <h3 className="mb-2 font-display text-xs uppercase tracking-[0.2em] font-bold text-foreground">Talk About It</h3>
          <div className="rounded-2xl border-2 border-foreground bg-card p-3 space-y-2" style={{ boxShadow: shadow }}>
            {comments.map((comment, i) => (
              <div key={i} className={`rounded-xl border-2 border-foreground ${commentColors[i % commentColors.length]} p-2.5`} style={{ boxShadow: shadowSm }}>
                <p className="text-[8px] font-display uppercase tracking-[0.15em] font-bold text-foreground">{comment.name}</p>
                <p className="mt-0.5 text-[10px] font-body leading-snug text-foreground">{comment.text}</p>
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <div className="flex-1 rounded-full" style={{ boxShadow: shadowSm }}>
                <Input placeholder="Add a comment to the memory..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  className="h-9 rounded-full border-2 border-foreground bg-card text-[10px] px-3 font-body" />
              </div>
              <button onClick={handlePostComment}
                className="flex h-9 items-center justify-center rounded-full border-2 border-foreground bg-squad-mint px-4 font-display text-[9px] font-bold uppercase tracking-[0.15em] text-foreground"
                style={{ boxShadow: shadowSm }}>
                Post
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
