'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Package, Star } from 'lucide-react';
import { VendorLayout } from '@/components/vendor-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import type { Vendor, Product, Order } from '@/lib/types';

export default function VendorAnalyticsPage() {
  return (
    <VendorLayout>
      <AnalyticsContent />
    </VendorLayout>
  );
}

function AnalyticsContent() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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
      if (!vendorData) { setLoading(false); return; }

      const [productsRes, orderItemsRes] = await Promise.all([
        supabase.from('products').select('*').eq('vendor_id', vendorData.id),
        supabase.from('order_items').select('order_id, price, quantity').eq('vendor_id', vendorData.id),
      ]);
      setProducts((productsRes.data as Product[]) ?? []);
      const orderItems = orderItemsRes.data ?? [];
      const orderIds = Array.from(new Set(orderItems.map((oi) => oi.order_id)));
      let ords: Order[] = [];
      if (orderIds.length > 0) {
        const { data: o } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('created_at', { ascending: true });
        ords = (o as Order[]) ?? [];
      }
      setOrders(ords);
      setLoading(false);
    })();
  }, [supabase, user]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const avgRating = products.length > 0
      ? products.reduce((s, p) => s + p.rating, 0) / products.length
      : 0;
    return { totalRevenue, avgOrderValue, avgRating };
  }, [orders, products]);

  const chartData = useMemo(() => {
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const filtered = orders.filter((o) => new Date(o.created_at) >= last30);
    const byDay = new Map<string, number>();
    filtered.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay.set(day, (byDay.get(day) ?? 0) + o.total);
    });
    return Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">Sales performance for {vendor?.shop_name}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-xl font-bold">{stats.avgRating.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Revenue (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Top Products by Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products
              .sort((a, b) => b.stock - a.stock)
              .slice(0, 5)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Stock: {p.stock}</span>
                    <span className="font-medium">{formatCurrency(p.price)}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
