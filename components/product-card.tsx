'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { StarRating } from '@/components/star-rating';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggle, has } = useWishlist();
  const primaryImage = product.product_images?.[0]?.url;
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <Card className="group relative flex flex-col overflow-hidden border-border/60 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted/30">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-semibold text-foreground">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
          {product.title}
        </Link>
        {product.vendor?.shop_name && (
          <Link href={`/shops/${product.vendor.slug}`} className="mt-0.5 text-xs text-muted-foreground hover:text-foreground">
            {product.vendor.shop_name}
          </Link>
        )}
        <div className="mt-1.5">
          <StarRating rating={product.rating} size={14} showValue reviewCount={product.review_count} />
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="text-base font-semibold">{formatCurrency(product.price)}</div>
            {discount > 0 && (
              <div className="text-xs text-muted-foreground line-through">{formatCurrency(product.compare_price!)}</div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggle(product.id)}
              aria-label="Toggle wishlist"
            >
              <Heart className={`h-4 w-4 ${has(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
            </Button>
            <Button
              size="sm"
              className="h-8"
              disabled={product.stock === 0}
              onClick={() => {
                addToCart(product.id, 1);
                toast.success('Added to cart');
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
