import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { handleImageError } from '../utils/imageUtils';

interface OrderItem {
  id: string;
  quantity: number;
  item_price: number;
  currency: string;
  name: string;
  image: string;
}

interface OrderMessageProps {
  items: OrderItem[];
  onViewDetails: () => void;
}

export function OrderMessage({ items, onViewDetails }: OrderMessageProps) {
  const totalAmount = items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
  const firstItem = items[0];

  return (
    <div className="bg-[#00DED2] rounded-3xl overflow-hidden text-white">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          <span className="font-medium">Order Summary</span>
        </div>
        <div className="flex items-center gap-3">
          {firstItem?.image && (
            <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden">
              <img
                src={firstItem.image}
                alt={firstItem.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 opacity-90">
              <ShoppingBag className="w-4 h-4" />
              <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="font-semibold text-lg mt-1">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={onViewDetails}
        className="w-full p-4 text-center font-medium hover:bg-white/10 transition-colors"
      >
        View Order Details
      </button>
    </div>
  );
} 