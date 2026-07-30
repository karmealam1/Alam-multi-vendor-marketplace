import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { createServerClient } from '@/lib/supabase/server';
import type { Product, Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

const featuredCategories = [
  { slug: 'electronics', label: 'Electronics', icon: '📱' },
  { slug: 'audio', label: 'Audio', icon: '🎧' },
  { slug: 'wearables', label: 'Wearables', icon: '⌚' },
  { slug: 'fashion', label: 'Fashion', icon: '👕' },
  { slug: 'home-kitchen', label: 'Home & Kitchen', icon: '🍳' },
  { slug: 'sports-outdoors', label: 'Sports', icon: '🧘' },
  { slug: 'books', label: 'Books', icon: '📚' },
  { slug: 'toys-games', label: 'Toys & Games', icon: '🎮' },
];

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% protected checkout' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer care' },
];

export default async function HomePage() {
  const supabase = createServerClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_images(*), vendor:vendors(*), category:categories(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('categories').select('*').order('name'),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const categories = (categoriesRes.data as Category[]) ?? [];
  const heroProduct = products[0];

  return (
    <StorefrontLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-sky-50 via-background to-emerald-50 dark:from-sky-950/30 dark:via-background dark:to-emerald-950/30">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              New arrivals every week
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Discover products from{' '}
              <span className="bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                independent vendors
              </span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Shop electronics, fashion, home essentials, and more from curated sellers. Quality you can trust, delivered to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/products">
                  Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">Become a Seller</Link>
              </Button>
            </div>
          </div>
          {heroProduct && (
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src={heroProduct.product_images?.[0]?.url ?? '/placeholder.png'}
                  alt={heroProduct.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
                <div className="text-xs text-muted-foreground">Featured</div>
                <div className="font-semibold">{heroProduct.title}</div>
                <div className="text-sm text-primary">${heroProduct.price}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 p-4 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
              <span className="text-center text-xs font-medium">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">New Arrivals</h2>
          <Link href="/products?sort=latest" className="text-sm font-medium text-primary hover:underline">
            See more
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {products.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 sm:p-12">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              Start selling on ShopSphere
            </h2>
            <p className="mt-2 text-primary-foreground/80">
              Reach millions of customers, manage your inventory, and grow your business with powerful vendor tools.
            </p>
            <Button size="lg" variant="secondary" className="mt-6" asChild>
              <Link href="/signup">Open your store</Link>
            </Button>
          </div>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-24 h-64 w-64 rounded-full bg-white/5" />
        </div>
      </section>
    </StorefrontLayout>
  );
}
