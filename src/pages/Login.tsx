import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, Bell } from 'lucide-react';

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header matching Figma */}
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <ArrowLeft className="h-4 w-4 text-primary-foreground" />
        </button>
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">Squad Memory</h2>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Bell className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 pt-8">
        {/* Title */}
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
          Plan Squad
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
          {isLogin ? 'Welcome Back' : 'Join the Squad'}
        </p>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="mt-8 w-full max-w-sm space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              required
              className="rounded-lg border-border bg-card"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="rounded-lg border-border bg-card pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-secondary text-secondary-foreground font-display uppercase tracking-wider"
          >
            {loading ? '...' : isLogin ? 'Log In' : 'Sign Up'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full rounded-lg font-display uppercase tracking-wider"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </Button>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-lg font-display uppercase tracking-wider"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="block w-full text-center text-xs uppercase tracking-wider text-muted-foreground"
            >
              Forgot Invite Code?
            </button>
          )}
        </form>
      </div>

      {/* Bottom nav placeholder matching Figma */}
      <div className="flex items-center justify-around border-t border-border bg-card px-2 py-3">
        {['Home', 'Squads', 'Wishlist', 'Hangouts', 'Profile'].map((label) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Login;
