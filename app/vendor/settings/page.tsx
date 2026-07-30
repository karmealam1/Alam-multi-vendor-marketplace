'use client';

import { useEffect, useState } from 'react';
import { Save, Store } from 'lucide-react';
import { VendorLayout } from '@/components/vendor-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import type { Vendor } from '@/lib/types';

export default function VendorSettingsPage() {
  return (
    <VendorLayout>
      <SettingsContent />
    </VendorLayout>
  );
}

function SettingsContent() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shop_name: '',
    description: '',
    logo_url: '',
    banner_url: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const v = data as Vendor;
        setVendor(v);
        if (v) {
          setForm({
            shop_name: v.shop_name,
            description: v.description ?? '',
            logo_url: v.logo_url ?? '',
            banner_url: v.banner_url ?? '',
          });
        }
        setLoading(false);
      });
  }, [supabase, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    const { error } = await supabase
      .from('vendors')
      .update({
        shop_name: form.shop_name,
        description: form.description,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
      })
      .eq('id', vendor.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to update settings');
      return;
    }
    toast.success('Settings saved');
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Store Settings</h1>
      <p className="text-sm text-muted-foreground">Manage your shop profile</p>

      <form onSubmit={handleSave} className="mt-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shop Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input
                value={form.shop_name}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Banner URL</Label>
              <Input
                value={form.banner_url}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
