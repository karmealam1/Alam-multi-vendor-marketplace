'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/format';
import { toast } from 'sonner';

export default function VendorOnboardingPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user } = useAuth();
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const slug = slugify(shopName) + '-' + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from('vendors').insert({
      user_id: user.id,
      shop_name: shopName,
      slug,
      description,
      status: 'pending',
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success('Store created! Awaiting admin approval.');
    router.push('/vendor');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </span>
          ShopSphere Vendor
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Set up your store</CardTitle>
            <CardDescription>Create your vendor shop to start selling on ShopSphere</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Shop Name</label>
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. TechNova Store"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers what your shop is about..."
                  rows={4}
                />
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-400">
                Your store will be reviewed by an admin before it goes live. You can start adding products right away.
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Store'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
