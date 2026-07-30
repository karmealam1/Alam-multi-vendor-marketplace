'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function CartPage() {
  return (
    <StorefrontLayout>
      <CartContent />
    </StorefrontLayout>
  );
}

function CartContent() {
  const { items, loading, updateQuantity, removeItem } = useCart();

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground">Browse our products and add items to your cart.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Your Cart ({items.length})</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const image = product.product_images?.[0]?.url;
            return (
              <Card key={item.id} className="flex gap-4 p-4">
                <Link href={`/products/${product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                  {image && (
                    <Image src={image} alt={product.title} fill sizes="96px" className="object-cover" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={`/products/${product.slug}`} className="font-medium hover:text-primary line-clamp-2">
                    {product.title}
                  </Link>
                  {product.vendor?.shop_name && (
                    <p className="text-xs text-muted-foreground">{product.vendor.shop_name}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold">{formatCurrency(product.price)}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-lg border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= product.stock}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600"
                      onClick={() => {
                        removeItem(item.id);
                        toast.success('Removed from cart');
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24 p-5">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <Button asChild className="mt-5 w-full" size="lg">
              <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href="/products">Continue Shopping</Link>
            </Button>
            {subtotal < 50 && subtotal > 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Add {formatCurrency(50 - subtotal)} more for free shipping!
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
