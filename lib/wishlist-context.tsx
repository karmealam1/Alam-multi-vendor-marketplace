'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { WishlistItem } from '@/lib/types';

interface WishlistContextValue {
  items: WishlistItem[];
  productIds: Set<string>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  productIds: new Set(),
  has: () => false,
  toggle: async () => {},
  refresh: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*, product:products(*, product_images(*), vendor:vendors(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Wishlist load error:', error.message);
    }
    setItems((data as WishlistItem[]) ?? []);
  }, [supabase, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const productIds = new Set(items.map((i) => i.product_id));

  const has = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const toggle = useCallback(async (productId: string) => {
    if (!user) return;
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      await supabase.from('wishlist_items').delete().eq('id', existing.id);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } else {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: user.id, product_id: productId })
        .select('*, product:products(*, product_images(*), vendor:vendors(*))')
        .maybeSingle();
      if (error) throw error;
      if (data) setItems((prev) => [data as WishlistItem, ...prev]);
    }
  }, [supabase, user, items]);

  return (
    <WishlistContext.Provider value={{ items, productIds, has, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
