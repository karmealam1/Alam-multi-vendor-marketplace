'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Heart, ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw, Star } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { StarRating } from '@/components/star-rating';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, Review } from '@/lib/types';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <StorefrontLayout>
      <ProductDetail slug={slug} />
    </StorefrontLayout>
  );
}

function ProductDetail({ slug }: { slug: string }) {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const { toggle, has } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    setLoading(true);
    supabase
      .from('products')
      .select('*, product_images(*), vendor:vendors(*), category:categories(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }
        const prod = data as Product;
        setProduct(prod);
        setActiveImage(0);

        if (prod.category_id) {
          const { data: rel } = await supabase
            .from('products')
            .select('*, product_images(*), vendor:vendors(*)')
            .eq('category_id', prod.category_id)
            .neq('id', prod.id)
            .eq('status', 'active')
            .limit(4);
          setRelated((rel as Product[]) ?? []);
        }

        const { data: revs } = await supabase
          .from('reviews')
          .select('*, profiles:profiles(full_name, avatar_url)')
          .eq('product_id', prod.id)
          .order('created_at', { ascending: false });
        setReviews((revs as Review[]) ?? []);

        setLoading(false);
      });
  }, [supabase, slug]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please sign in to checkout');
      return;
    }
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      window.location.href = '/cart';
    } catch {
      toast.error('Failed to proceed');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
    });
    setSubmittingReview(false);
    if (error) {
      toast.error(error.message.includes('duplicate') || error.message.includes('unique')
        ? 'You have already reviewed this product'
        : 'Failed to submit review');
      return;
    }
    toast.success('Review submitted');
    setReviewTitle('');
    setReviewComment('');
    setReviewRating(5);
    const { data: revs } = await supabase
      .from('reviews')
      .select('*, profiles:profiles(full_name, avatar_url)')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    setReviews((revs as Review[]) ?? []);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const images = product.product_images ?? [];
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;
  const inWishlist = has(product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground capitalize">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/30">
            {images[activeImage] ? (
              <Image
                src={images[activeImage].url}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-16 w-16" />
              </div>
            )}
            {discount > 0 && (
              <span className="absolute left-3 top-3 rounded-md bg-rose-500 px-2.5 py-1 text-sm font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                    activeImage === i ? 'border-primary' : 'border-transparent hover:border-border'
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            {product.vendor && (
              <Link href={`/shops/${product.vendor.slug}`} className="text-sm font-medium text-primary hover:underline">
                {product.vendor.shop_name}
              </Link>
            )}
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StarRating rating={product.rating} size={18} showValue reviewCount={product.review_count} />
              {product.stock > 0 ? (
                <span className="text-sm font-medium text-emerald-600">In stock</span>
              ) : (
                <span className="text-sm font-medium text-rose-500">Out of stock</span>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
            {discount > 0 && (
              <span className="text-lg text-muted-foreground line-through">{formatCurrency(product.compare_price!)}</span>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {/* Quantity + actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button size="lg" onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 min-w-40">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => {
                if (!user) { toast.error('Please sign in'); return; }
                toggle(product.id);
                toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
              }}
              aria-label="Toggle wishlist"
            >
              <Heart className={cn('h-5 w-5', inWishlist && 'fill-rose-500 text-rose-500')} />
            </Button>
          </div>

          <Button size="lg" variant="secondary" onClick={handleBuyNow} disabled={product.stock === 0} className="w-full">
            Buy Now
          </Button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 border-t pt-5">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Free shipping over $50</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Secure checkout</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">30-day returns</span>
            </div>
          </div>

          {product.sku && (
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <Separator className="mb-8" />
        <h2 className="text-xl font-bold">Customer Reviews</h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Review summary */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{product.rating.toFixed(1)}</div>
                <div>
                  <StarRating rating={product.rating} size={18} />
                  <p className="mt-1 text-sm text-muted-foreground">{product.review_count} reviews</p>
                </div>
              </div>
            </Card>

            {/* Write review */}
            {user && profile?.role === 'customer' && (
              <Card className="p-5">
                <h3 className="font-semibold">Write a Review</h3>
                <form onSubmit={submitReview} className="mt-3 space-y-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                      >
                        <Star
                          className={cn(
                            'h-6 w-6 transition-colors',
                            star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Review title"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    required
                  />
                  <Button type="submit" disabled={submittingReview} className="w-full">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </Card>
            )}
            {!user && (
              <Card className="p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link> to write a review
                </p>
              </Card>
            )}
          </div>

          {/* Review list */}
          <div className="space-y-4 lg:col-span-2">
            {reviews.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                        {(review.profiles?.full_name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{review.profiles?.full_name ?? 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(review.created_at)}</div>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.title && <h4 className="mt-3 font-medium">{review.title}</h4>}
                  {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12">
          <Separator className="mb-8" />
          <h2 className="text-xl font-bold">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
