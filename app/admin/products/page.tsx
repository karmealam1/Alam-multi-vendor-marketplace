'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <ProductsContent />
    </AdminLayout>
  );
}

function ProductsContent() {
  const supabase = createClientComponentClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_images(*), vendor:vendors(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setProducts((data as Product[]) ?? []);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Products</h1>
      <p className="text-sm text-muted-foreground">All products across the marketplace</p>

      <div className="mt-4 relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No products found.</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Product</th>
                <th className="hidden p-3 text-left text-sm font-medium md:table-cell">Vendor</th>
                <th className="hidden p-3 text-left text-sm font-medium sm:table-cell">Price</th>
                <th className="hidden p-3 text-left text-sm font-medium sm:table-cell">Stock</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link href={`/products/${p.slug}`} className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                        {p.product_images?.[0]?.url && (
                          <Image src={p.product_images[0].url} alt={p.title} fill sizes="40px" className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden p-3 text-sm md:table-cell">{p.vendor?.shop_name ?? 'Unknown'}</td>
                  <td className="hidden p-3 text-sm sm:table-cell">{formatCurrency(p.price)}</td>
                  <td className="hidden p-3 text-sm sm:table-cell">{p.stock}</td>
                  <td className="p-3">
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
