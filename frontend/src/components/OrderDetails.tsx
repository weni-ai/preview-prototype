import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { formatBRL } from '../utils/currency';

interface OrderItem {
  product_retailer_id: string;
  quantity: number;
  item_price: number;
  currency: string;
  name: string;
  image: string;
}

interface OrderDetailsProps {
  items: OrderItem[];
  timestamp: string;
  onClose: () => void;
}

export function OrderDetails({ items, timestamp, onClose }: OrderDetailsProps) {
  const totalAmount = items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
  const formattedDate = new Date(timestamp).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white p-4 flex items-center gap-4">
        <button onClick={onClose} className="p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Order Details</h1>
          <p className="text-sm opacity-90">{formattedDate}</p>
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-gray-600">
          <ShoppingBag className="w-5 h-5" />
          <span className="font-medium">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div className="text-[#00DED2] font-semibold text-lg mt-1">
          {formatBRL(totalAmount)}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="p-4 border-b flex gap-4">
            {item.image && (
              <div className="w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/80?text=No+Image';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{item.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <div className="text-[#00DED2] font-medium">
                  {formatBRL(item.item_price)}
                </div>
                <div className="text-gray-600">
                  Quantity: {item.quantity}
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Subtotal: {formatBRL(item.item_price * item.quantity)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t p-4 space-y-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">Total Amount</span>
          <span className="text-[#00DED2] font-bold text-lg">{formatBRL(totalAmount)}</span>
        </div>
        <p className="text-sm text-gray-500">
          Thank you for your order. We will process it shortly.
        </p>
      </div>
    </motion.div>
  );
} 