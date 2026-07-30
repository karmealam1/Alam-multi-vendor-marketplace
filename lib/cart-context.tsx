'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { CartItem, Product } from '@/lib/types';

interface CartContextValue {
  items: CartItem[];
  count: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  loading: false,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*, product_images(*), vendor:vendors(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Cart load error:', error.message);
    }
    setItems((data as CartItem[]) ?? []);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!user) return;
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
      return;
    }
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity });
    if (error) throw error;
    await refresh();
  }, [supabase, user, items, refresh]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    if (error) throw error;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  }, [supabase]);

  const removeItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
    if (error) throw error;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, [supabase]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
    if (error) throw error;
    setItems([]);
  }, [supabase, user]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, loading, addToCart, updateQuantity, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
