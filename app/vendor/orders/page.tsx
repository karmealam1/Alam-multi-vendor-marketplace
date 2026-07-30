'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { VendorLayout } from '@/components/vendor-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Vendor, Order } from '@/lib/types';

export default function VendorOrdersPage() {
  return (
    <VendorLayout>
      <OrdersContent />
    </VendorLayout>
  );
}

function OrdersContent() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: v } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      const vendorData = v as Vendor;
      setVendor(vendorData);

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('vendor_id', vendorData?.id);

      const orderIds = Array.from(new Set((orderItems ?? []).map((oi) => oi.order_id)));
      if (orderIds.length === 0) { setLoading(false); return; }

      const { data: ords } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
      setOrders((ords as Order[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, user]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-muted-foreground">Orders containing your products</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Orders with your products will appear here.</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const vendorItems = order.order_items?.filter((oi) => oi.vendor_id === vendor?.id) ?? [];
            const vendorTotal = vendorItems.reduce((s, oi) => s + oi.price * oi.quantity, 0);
            return (
              <Card key={order.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ship to: {order.shipping_name}, {order.shipping_city}, {order.shipping_country}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(vendorTotal)}</div>
                    <div className="text-xs text-muted-foreground">{vendorItems.length} items</div>
                  </div>
                </div>
                <div className="mt-3 space-y-2 border-t pt-3">
                  {vendorItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.title} x{item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
