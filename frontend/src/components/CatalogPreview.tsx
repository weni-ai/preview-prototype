import React from 'react';
import { handleImageError } from '../utils/imageUtils';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
}

interface CatalogPreviewProps {
  products: Product[];
  onViewCatalog: () => void;
}

export function CatalogPreview({ products, onViewCatalog }: CatalogPreviewProps) {
  // Show only the first product as preview
  const previewProduct = products[0];

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {/* Preview Image and Title */}
      <div className="relative">
        <img
          src={previewProduct.image}
          alt={previewProduct.name}
          className="w-full h-48 object-cover"
          onError={handleImageError}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-medium">View Product Catalog</h3>
          <p className="text-white/80 text-sm">Browse products and prices</p>
        </div>
      </div>

      {/* View Catalog Button */}
      <button
        onClick={onViewCatalog}
        className="w-full p-3 text-[#00DED2] font-medium text-center hover:bg-gray-50"
      >
        View catalog
      </button>
    </div>
  );
} 