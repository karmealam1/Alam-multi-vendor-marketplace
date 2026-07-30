'use client';

import { VendorLayout } from '@/components/vendor-layout';
import { ProductForm } from '@/components/product-form';

export default function NewProductPage() {
  return (
    <VendorLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <ProductForm />
      </div>
    </VendorLayout>
  );
}
