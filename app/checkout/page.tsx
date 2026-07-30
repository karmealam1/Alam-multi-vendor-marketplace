'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, ShoppingBag, Check } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function CheckoutPage() {
  return (
    <StorefrontLayout>
      <CheckoutContent />
    </StorefrontLayout>
  );
}

function CheckoutContent() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { items, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: profile?.full_name ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? '',
    postalCode: profile?.postal_code ?? '',
    country: profile?.country ?? 'United States',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to checkout');
      router.push('/login');
      return;
    }
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'paid',
          payment_status: 'paid',
          payment_intent: 'demo_pi_' + Math.random().toString(36).slice(2),
          subtotal,
          shipping,
          tax,
          total,
          shipping_name: form.name,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_postal_code: form.postalCode,
          shipping_country: form.country,
        })
        .select()
        .maybeSingle();

      if (orderError || !order) throw orderError ?? new Error('Failed to create order');

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        vendor_id: item.product?.vendor_id ?? null,
        title: item.product?.title ?? 'Unknown Product',
        price: item.product?.price ?? 0,
        quantity: item.quantity,
        image_url: item.product?.product_images?.[0]?.url ?? null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      await clearCart();
      setPlaced(order.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardContent className="pt-10 pb-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Order Confirmed!</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Order ID: {placed.slice(0, 8)}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link href="/orders">View Orders</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Your cart is empty</h1>
        <Button asChild className="mt-6">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Street Address</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-400">
                <Lock className="h-4 w-4" />
                This is a demo checkout. No real payment will be processed.
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.cardNumber}
                    onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CVC</label>
                  <Input
                    value={form.cvc}
                    onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                    placeholder="123"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 pr-2">
                    {item.product?.title} x{item.quantity}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatCurrency((item.product?.price ?? 0) * item.quantity)}
                  </span>
                </div>
              ))}
              <Separator className="my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Button type="submit" className="mt-4 w-full" size="lg" disabled={placing}>
                {placing ? 'Placing order...' : `Pay ${formatCurrency(total)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
