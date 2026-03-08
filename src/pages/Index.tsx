import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) navigate('/', { replace: true });
      else navigate('/login', { replace: true });
    }
  }, [user, loading]);

  return null;
};

export default Index;
