import Link from 'next/link';
import { Store, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </span>
              ShopSphere
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A modern multi-vendor marketplace connecting you with independent sellers worldwide.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
              <li><Link href="/products?category=electronics" className="hover:text-foreground">Electronics</Link></li>
              <li><Link href="/products?category=fashion" className="hover:text-foreground">Fashion</Link></li>
              <li><Link href="/products?category=home-kitchen" className="hover:text-foreground">Home & Kitchen</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Sell</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/signup" className="hover:text-foreground">Become a Vendor</Link></li>
              <li><Link href="/vendor" className="hover:text-foreground">Vendor Dashboard</Link></li>
              <li><Link href="/vendor/products" className="hover:text-foreground">Manage Products</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@shopsphere.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 1-800-SHOP-SPHERE</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> San Francisco, CA</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
