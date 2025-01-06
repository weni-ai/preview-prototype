import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatBRL } from '../utils/currency';

interface CartProps {
  onClose: () => void;
  onPlaceOrder: (items: any[]) => void;
}

export function Cart({ onClose, onPlaceOrder }: CartProps) {
  const { items, updateQuantity, totalAmount, clearCart } = useCart();

  const handlePlaceOrder = () => {
    const orderItems = items.map(item => ({
      product_retailer_id: item.product_retailer_id,
      quantity: item.quantity,
      item_price: item.price,
      currency: "BRL",
      name: item.name,
      image: item.image,
      sellerId: item.sellerId
    }));
    onPlaceOrder(orderItems);
    clearCart();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your cart</h2>
            <p className="text-sm text-gray-500">{items.length} items</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/64?text=No+Image';
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-medium">{formatBRL(item.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Subtotal</span>
            <span className="font-bold">{formatBRL(totalAmount)}</span>
          </div>
          <p className="text-sm text-gray-500">
            Additional charges may apply. We will follow-up on how to complete your order & pay.
          </p>
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white py-3 rounded-lg font-medium"
          >
            PLACE ORDER
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 