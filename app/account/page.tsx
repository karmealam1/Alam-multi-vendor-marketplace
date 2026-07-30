'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Package, Heart, MapPin } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AccountPage() {
  return (
    <StorefrontLayout>
      <AccountContent />
    </StorefrontLayout>
  );
}

function AccountContent() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const supabase = createClientComponentClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        postal_code: profile.postal_code ?? '',
        country: profile.country ?? '',
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Sign in to view your account</h1>
        <Button asChild className="mt-6">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to update profile'); return; }
    await refreshProfile();
    toast.success('Profile updated');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">My Account</h1>
      <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Link href="/orders">
          <Card className="flex flex-col items-center gap-2 p-4 text-center transition-colors hover:bg-accent">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Orders</span>
          </Card>
        </Link>
        <Link href="/wishlist">
          <Card className="flex flex-col items-center gap-2 p-4 text-center transition-colors hover:bg-accent">
            <Heart className="h-6 w-6 text-rose-500" />
            <span className="text-sm font-medium">Wishlist</span>
          </Card>
        </Link>
        <Card className="flex flex-col items-center gap-2 p-4 text-center">
          <User className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium capitalize">{profile?.role}</span>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
