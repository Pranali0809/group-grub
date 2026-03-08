import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, MoreVertical, Home, Users, Heart, Utensils, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || 'Failed to sign in with Google');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent!');
    }
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Squads', path: '/squads' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: Utensils, label: 'Hangouts', path: '/hangouts' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Retro solid box-shadow style
  const shadowSm = '3px 3px 0px 0px hsl(0 0% 8%)';
  const shadowMd = '4px 4px 0px 0px hsl(0 0% 8%)';

  return (
    <div className="flex min-h-screen flex-col bg-squad-pink">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-squad-pink border-2 border-foreground"
          style={{ boxShadow: shadowSm }}
        >
          <ArrowLeft className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        </button>
        <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">
          Squad Memory
        </h2>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-squad-pink border-2 border-foreground"
          style={{ boxShadow: shadowSm }}
        >
          <MoreVertical className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center px-8 pt-10 pb-4">
        {/* Title */}
        <h1 className="font-display text-[32px] font-bold uppercase tracking-tight italic text-foreground leading-none">
          Plan Squad
        </h1>

        {/* Divider */}
        <div className="mt-5 mb-3 w-48 border-t-2 border-foreground" />

        {/* Subtitle */}
        <p className="text-[11px] font-display uppercase tracking-[0.25em] font-bold text-foreground">
          {isLogin ? 'Join the Squad' : 'Join the Squad'}
        </p>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="mt-8 w-full max-w-[280px] space-y-5">
          <div>
            <label className="mb-2 block text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">
              Email Address
            </label>
            <div style={{ boxShadow: shadowSm }} className="rounded-full">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pixel@plansquad.com"
                required
                className="h-11 rounded-full border-2 border-foreground bg-card font-body text-xs px-5 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground">
              Password
            </label>
            <div className="relative rounded-full" style={{ boxShadow: shadowSm }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11 rounded-full border-2 border-foreground bg-card pr-11 font-body text-xs px-5 placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-squad-pink border-2 border-foreground text-foreground font-display uppercase tracking-[0.2em] font-bold text-[11px] hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ boxShadow: shadowMd }}
            >
              {loading ? '...' : isLogin ? 'Log In' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full h-12 rounded-full bg-squad-lavender border-2 border-foreground text-foreground font-display uppercase tracking-[0.2em] font-bold text-[11px] hover:opacity-90 transition-opacity"
              style={{ boxShadow: shadowMd }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 rounded-full border-2 border-foreground bg-card text-foreground font-display uppercase tracking-[0.2em] font-bold text-[11px] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              style={{ boxShadow: shadowMd }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="block w-full text-center text-[9px] font-display uppercase tracking-[0.2em] font-bold text-foreground pt-2"
            >
              Forgot Secret Code?
            </button>
          )}
        </form>
      </div>

      {/* Bottom nav - clickable */}
      <div className="flex items-center justify-around border-t-2 border-foreground bg-card px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-squad-pink border-2 border-foreground"
              style={{ boxShadow: '2px 2px 0px 0px hsl(0 0% 8%)' }}
            >
              <item.icon className="h-3.5 w-3.5 text-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-[7px] font-display uppercase tracking-[0.15em] font-bold text-foreground">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Login;
