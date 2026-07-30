'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { StorefrontLayout } from '@/components/storefront-layout';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { createClientComponentClient } from '@/lib/supabase/client';
import type { Product, Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const PRICE_RANGES = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: 'Over $250', min: 250, max: 9999 },
];

const PAGE_SIZE = 12;

export default function ProductsPage() {
  return (
    <StorefrontLayout>
      <ProductsContent />
    </StorefrontLayout>
  );
}

function ProductsContent() {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'latest';
  const priceRange = searchParams.get('price') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, [supabase]);

  const buildQuery = useCallback(
    (pageNum: number) => {
      let query = supabase
        .from('products')
        .select('*, product_images(*), vendor:vendors(*), category:categories(*)', { count: 'exact' })
        .eq('status', 'active');

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }
      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }
      if (priceRange) {
        const range = PRICE_RANGES.find((r) => r.label === priceRange);
        if (range) {
          query = query.gte('price', range.min).lt('price', range.max);
        }
      }

      switch (sort) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      return query.range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1);
    },
    [supabase, q, categorySlug, sort, priceRange]
  );

  useEffect(() => {
    setLoading(true);
    setProducts([]);
    setPage(0);
    setHasMore(true);
    buildQuery(0).then(({ data, count, error }) => {
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      setProducts((data as Product[]) ?? []);
      setTotalCount(count ?? 0);
      setHasMore(((data as Product[]) ?? []).length === PAGE_SIZE);
      setLoading(false);
    });
  }, [buildQuery]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    buildQuery(next).then(({ data, error }) => {
      if (error) return;
      const newItems = (data as Product[]) ?? [];
      setProducts((prev) => [...prev, ...newItems]);
      setPage(next);
      setHasMore(newItems.length === PAGE_SIZE);
    });
  }, [buildQuery, page]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const activeFilters = [categorySlug, priceRange].filter(Boolean);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateParam('category', '')}
            className={cn(
              'block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
              !categorySlug && 'bg-accent font-medium'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={cn(
                'block w-full rounded-md px-3 py-1.5 text-left text-sm capitalize transition-colors hover:bg-accent',
                categorySlug === cat.slug && 'bg-accent font-medium'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Price Range</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateParam('price', '')}
            className={cn(
              'block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
              !priceRange && 'bg-accent font-medium'
            )}
          >
            Any Price
          </button>
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => updateParam('price', range.label)}
              className={cn(
                'block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                priceRange === range.label && 'bg-accent font-medium'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">
            {q ? `Results for "${q}"` : categorySlug ? `${categorySlug.replace(/-/g, ' ')}` : 'All Products'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'product' : 'products'} found
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl border border-border/60 p-4">
              {FilterPanel}
            </div>
          </aside>

          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <form onSubmit={handleSearch} className="flex-1 min-w-48">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search within results..."
                  className="max-w-xs"
                />
              </form>

              <div className="flex items-center gap-2">
                {/* Mobile filter */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters
                      {activeFilters.length > 0 && (
                        <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                          {activeFilters.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">{FilterPanel}</div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {categorySlug && (
                  <button
                    onClick={() => updateParam('category', '')}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium capitalize hover:bg-accent/80"
                  >
                    {categorySlug.replace(/-/g, ' ')} <X className="h-3 w-3" />
                  </button>
                )}
                {priceRange && (
                  <button
                    onClick={() => updateParam('price', '')}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium hover:bg-accent/80"
                  >
                    {priceRange} <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/products')}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button variant="outline" onClick={loadMore}>
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
