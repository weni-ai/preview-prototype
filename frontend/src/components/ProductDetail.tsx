import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice?: number;
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (quantity: number) => void;
  initialQuantity?: number;
}

export function ProductDetail({ product, onClose, onAddToCart, initialQuantity = 0 }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(0, prev + delta));
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(quantity);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white p-4 flex items-center gap-4">
        <button onClick={onClose} className="p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold flex-1">{product.name}</h1>
      </div>

      {/* Product Image */}
      <div className="aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-[#00DED2] text-xl font-semibold">
              {formatCurrency(product.price)}
            </p>
            {product.originalPrice && (
              <span className="text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600">{product.description}</p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">Quantity</span>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => updateQuantity(-1)}
              className="p-2 rounded-full hover:bg-gray-200"
              disabled={quantity === 0}
              whileTap={{ scale: 0.9 }}
            >
              <Minus className="w-5 h-5" />
            </motion.button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <motion.button
              onClick={() => updateQuantity(1)}
              className="p-2 rounded-full hover:bg-gray-200"
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="p-4 border-t">
        <motion.button
          onClick={handleAddToCart}
          disabled={quantity === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            quantity === 0
              ? 'bg-gray-100 text-gray-400'
              : 'bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white'
          }`}
        >
          {quantity === 0 ? 'SELECT QUANTITY' : `ADD TO CART • ${formatCurrency(product.price * quantity)}`}
        </motion.button>
      </div>
    </motion.div>
  );
} 