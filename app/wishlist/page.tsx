'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/lib/wishlist-context';
import { useAuth } from '@/lib/auth-context';

export default function WishlistPage() {
  return (
    <StorefrontLayout>
      <WishlistContent />
    </StorefrontLayout>
  );
}

function WishlistContent() {
  const { items } = useWishlist();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Sign in to view your wishlist</h1>
        <Button asChild className="mt-6">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">My Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>

      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground">Save items you love to find them quickly later.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Discover Products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product!} />
          ))}
        </div>
      )}
    </div>
  );
}
