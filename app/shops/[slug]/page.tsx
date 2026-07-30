'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { ProductCard } from '@/components/product-card';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/star-rating';
import { createClientComponentClient } from '@/lib/supabase/client';
import type { Vendor, Product } from '@/lib/types';

export default function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <StorefrontLayout>
      <ShopContent slug={slug} />
    </StorefrontLayout>
  );
}

function ShopContent({ slug }: { slug: string }) {
  const supabase = createClientComponentClient();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      setVendor(v as Vendor);

      if (v) {
        const { data: prods } = await supabase
          .from('products')
          .select('*, product_images(*), vendor:vendors(*)')
          .eq('vendor_id', (v as Vendor).id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        setProducts((prods as Product[]) ?? []);
      }
      setLoading(false);
    })();
  }, [supabase, slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-48 w-full" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Store className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Shop not found</h1>
        <Link href="/products" className="mt-4 inline-block text-primary hover:underline">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-40 bg-gradient-to-r from-primary/20 to-primary/5 sm:h-56">
        {vendor.banner_url && (
          <Image src={vendor.banner_url} alt={vendor.shop_name} fill className="object-cover" sizes="100vw" />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-muted">
            {vendor.logo_url ? (
              <Image src={vendor.logo_url} alt={vendor.shop_name} fill sizes="96px" className="object-cover" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-2xl font-bold">{vendor.shop_name}</h1>
            <div className="mt-1 flex items-center gap-3">
              <StarRating rating={vendor.rating} size={16} showValue />
              <span className="text-sm text-muted-foreground">{products.length} products</span>
            </div>
          </div>
        </div>

        {vendor.description && (
          <p className="mt-4 max-w-2xl text-muted-foreground">{vendor.description}</p>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Products</h2>
          {products.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No products available yet.
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
