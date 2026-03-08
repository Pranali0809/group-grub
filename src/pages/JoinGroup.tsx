import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const JoinGroup = () => {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/join/${code}`);
      return;
    }
    if (!code || joining) return;

    const joinGroup = async () => {
      setJoining(true);
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (!group) {
        toast.error('Invalid invite code');
        navigate('/squads');
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id });

      if (error && error.code === '23505') {
        toast.info('Already a member!');
      } else if (error) {
        toast.error(error.message);
      } else {
        toast.success('Joined squad!');
      }

      navigate(`/squads/${group.id}`);
    };

    joinGroup();
  }, [user, loading, code]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="font-display uppercase tracking-wider text-muted-foreground">Joining squad...</p>
    </div>
  );
};

export default JoinGroup;
