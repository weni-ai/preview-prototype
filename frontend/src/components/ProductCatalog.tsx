import React from 'react';
import { ChevronLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { formatBRL } from '../utils/currency';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
}

interface ProductCatalogProps {
  products: Product[];
  onClose: () => void;
}

export function ProductCatalog({ products, onClose }: ProductCatalogProps) {
  const [selectedQuantities, setSelectedQuantities] = React.useState<Record<string, number>>({});

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedQuantities(prev => {
      const current = prev[productId] || 0;
      const newQuantity = Math.max(0, current + delta);
      return { ...prev, [productId]: newQuantity };
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white p-4 flex items-center gap-4">
        <button onClick={onClose} className="p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Product Catalog</h1>
          <p className="text-sm opacity-90">Browse our products</p>
        </div>
        <div className="ml-auto">
          <ShoppingCart className="w-6 h-6" />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto">
        {products.map((product) => (
          <div key={product.id} className="border-b p-4">
            <div className="flex gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                <p className="text-[#00DED2] font-semibold mt-1">{formatBRL(product.price)}</p>
              </div>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center justify-end mt-2 gap-3">
              <button
                onClick={() => updateQuantity(product.id, -1)}
                className="p-1 rounded-full hover:bg-gray-100"
                disabled={!selectedQuantities[product.id]}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-8 text-center">{selectedQuantities[product.id] || 0}</span>
              <button
                onClick={() => updateQuantity(product.id, 1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Cart Button */}
      {Object.values(selectedQuantities).some(q => q > 0) && (
        <div className="p-4 border-t">
          <button className="w-full bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white py-3 rounded-lg font-medium">
            VIEW CART
          </button>
        </div>
      )}
    </div>
  );
} 