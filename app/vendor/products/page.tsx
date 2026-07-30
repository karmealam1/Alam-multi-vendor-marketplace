'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { VendorLayout } from '@/components/vendor-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import type { Vendor, Product } from '@/lib/types';

export default function VendorProductsPage() {
  return (
    <VendorLayout>
      <ProductsContent />
    </VendorLayout>
  );
}

function ProductsContent() {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async (vendorId: string) => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

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
      if (vendorData) await loadProducts(vendorData.id);
      else setLoading(false);
    })();
  }, [supabase, user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete product');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Product deleted');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : products.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No products yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add your first product to start selling.</p>
          <Button asChild className="mt-6">
            <Link href="/vendor/products/new">Add Product</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Product</th>
                <th className="hidden p-3 text-left text-sm font-medium sm:table-cell">Price</th>
                <th className="hidden p-3 text-left text-sm font-medium sm:table-cell">Stock</th>
                <th className="p-3 text-left text-sm font-medium">Status</th>
                <th className="p-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                        {p.product_images?.[0]?.url && (
                          <Image src={p.product_images[0].url} alt={p.title} fill sizes="48px" className="object-cover" />
                        )}
                      </div>
                      <span className="text-sm font-medium line-clamp-1">{p.title}</span>
                    </div>
                  </td>
                  <td className="hidden p-3 text-sm sm:table-cell">{formatCurrency(p.price)}</td>
                  <td className="hidden p-3 text-sm sm:table-cell">
                    <Badge variant={p.stock === 0 ? 'destructive' : p.stock < 10 ? 'secondary' : 'outline'}>
                      {p.stock}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/vendor/products/${p.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{p.title}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
