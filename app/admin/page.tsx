'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Users, Store, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { createClientComponentClient } from '@/lib/supabase/client';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Order, Profile, Vendor, Product } from '@/lib/types';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}

function DashboardContent() {
  const supabase = createClientComponentClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersRes, customersRes, vendorsRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
        supabase.from('vendors').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
      ]);
      setOrders((ordersRes.data as Order[]) ?? []);
      setCustomers((customersRes.data as Profile[]) ?? []);
      setVendors((vendorsRes.data as Vendor[]) ?? []);
      setProducts((productsRes.data as Product[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingVendors = vendors.filter((v) => v.status === 'pending');

  const chartData = (() => {
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const filtered = orders.filter((o) => new Date(o.created_at) >= last30);
    const byDay = new Map<string, number>();
    filtered.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay.set(day, (byDay.get(day) ?? 0) + o.total);
    });
    return Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue }));
  })();

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { label: 'Customers', value: customers.length.toString(), icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Vendors', value: vendors.length.toString(), icon: Store, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Products', value: products.length.toString(), icon: Package, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  ];

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">Platform overview and analytics</p>

      {pendingVendors.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <TrendingUp className="h-4 w-4" />
            {pendingVendors.length} vendor {pendingVendors.length === 1 ? 'request' : 'requests'} pending approval
          </div>
          <Link href="/admin/vendors" className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
            Review now
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/orders" className="mt-4 block text-center text-sm text-primary hover:underline">
              View all orders
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
