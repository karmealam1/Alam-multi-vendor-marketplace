'use client';

import { useEffect, useState } from 'react';
import { Store, Check, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/star-rating';
import { createClientComponentClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { Vendor } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  suspended: 'bg-muted text-muted-foreground',
};

export default function AdminVendorsPage() {
  return (
    <AdminLayout>
      <VendorsContent />
    </AdminLayout>
  );
}

function VendorsContent() {
  const supabase = createClientComponentClient();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVendors = async () => {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    setVendors((data as Vendor[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadVendors();
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('vendors').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update vendor status');
      return;
    }
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: status as Vendor['status'] } : v)));
    toast.success(`Vendor ${status}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Vendors</h1>
      <p className="text-sm text-muted-foreground">Approve and manage vendor stores</p>

      {vendors.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <Store className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No vendors registered yet.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{vendor.shop_name}</h3>
                    <div className="mt-0.5">
                      <StarRating rating={vendor.rating} size={14} showValue />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Joined {formatDate(vendor.created_at)}</p>
                  </div>
                </div>
                <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
              </div>

              {vendor.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{vendor.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {vendor.status !== 'approved' && (
                  <Button size="sm" onClick={() => updateStatus(vendor.id, 'approved')}>
                    <Check className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                )}
                {vendor.status !== 'rejected' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(vendor.id, 'rejected')}>
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                )}
                {vendor.status === 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(vendor.id, 'suspended')}>
                    Suspend
                  </Button>
                )}
                {vendor.status === 'suspended' && (
                  <Button size="sm" onClick={() => updateStatus(vendor.id, 'approved')}>
                    Reactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
