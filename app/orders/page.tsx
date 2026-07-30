'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function OrdersPage() {
  return (
    <StorefrontLayout>
      <OrdersContent />
    </StorefrontLayout>
  );
}

function OrdersContent() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [supabase, user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Sign in to view your orders</h1>
        <Button asChild className="mt-6">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {loading ? (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">When you place an order, it will appear here.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                    <Badge className={statusColors[order.status]} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(order.total)}</div>
                  <div className="text-xs text-muted-foreground">{order.order_items?.length ?? 0} items</div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <Link
                      key={item.id}
                      href={item.product_id ? `/products/${item.title.toLowerCase().replace(/\s+/g, '-')}` : '#'}
                      className="flex items-center gap-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                        {item.image_url && (
                          <Image src={item.image_url} alt={item.title} fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                {order.tracking_number && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tracking: <span className="font-medium text-foreground">{order.tracking_number}</span>
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
