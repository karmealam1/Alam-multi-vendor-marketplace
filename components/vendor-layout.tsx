'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Store, LayoutDashboard, Package, ShoppingBag, Settings, ChartBar as BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/lib/types';

const navItems = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const supabase = createClientComponentClient();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile?.role !== 'vendor') {
      router.push('/');
      return;
    }
    supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setVendor(data as Vendor);
        setVendorLoading(false);
        if (!data && pathname !== '/vendor/onboarding') {
          router.push('/vendor/onboarding');
        }
      });
  }, [user, profile, loading, supabase, router, pathname]);

  if (loading || vendorLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 border-r p-4">
          <Skeleton className="h-8 w-full" />
          <div className="mt-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-background md:flex md:flex-col">
        <div className="border-b p-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            <span>Vendor</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3">
          <Link href="/vendor" className="flex items-center gap-2 font-bold">
            <Store className="h-5 w-5" />
            Vendor
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  pathname === item.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
