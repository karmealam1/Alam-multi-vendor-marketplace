'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { AdminLayout } from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@/lib/supabase/client';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <OrdersContent />
    </AdminLayout>
  );
}

function OrdersContent() {
  const supabase = createClientComponentClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-muted-foreground">All marketplace orders</p>

      {orders.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    <Badge variant="outline">{order.payment_status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Ship to: {order.shipping_name}, {order.shipping_city}, {order.shipping_country}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(order.total)}</div>
                  <div className="text-xs text-muted-foreground">{order.order_items?.length ?? 0} items</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t pt-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.title} x{item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
