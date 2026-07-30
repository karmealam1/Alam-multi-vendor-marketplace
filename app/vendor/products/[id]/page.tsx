'use client';

import { useEffect, useState, use } from 'react';
import { VendorLayout } from '@/components/vendor-layout';
import { ProductForm } from '@/components/product-form';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error);
        setProduct(data as Product);
        setLoading(false);
      });
  }, [supabase, id]);

  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : product ? (
          <ProductForm product={product} />
        ) : (
          <p className="text-muted-foreground">Product not found.</p>
        )}
      </div>
    </VendorLayout>
  );
}
