'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { createClientComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success('Welcome back!');
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      const role = profile?.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'vendor') router.push('/vendor');
      else router.push('/');
    } else {
      router.push('/');
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo1234!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-background to-emerald-50 px-4 dark:from-sky-950/30 dark:to-emerald-950/30">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </span>
          ShopSphere
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your ShopSphere account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => toast.info('Password reset coming soon')}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Quick demo login</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <button onClick={() => fillDemo('demo.customer@marketplace.test')} className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/20">
              Customer
            </button>
            <button onClick={() => fillDemo('demo.vendor@marketplace.test')} className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/20">
              Vendor
            </button>
            <button onClick={() => fillDemo('admin@marketplace.test')} className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/20">
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
