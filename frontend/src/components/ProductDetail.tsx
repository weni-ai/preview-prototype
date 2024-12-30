import React, { useState } from 'react';
import { ChevronLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { formatBRL } from '../utils/currency';
import { motion } from 'framer-motion';

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
}

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);

  const updateQuantity = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white p-4 flex items-center gap-4"
      >
        <motion.button
          onClick={onClose}
          className="p-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="text-lg font-semibold flex-1">{product.name}</h1>
        <motion.div
          className="relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            1
          </span>
        </motion.div>
      </motion.div>

      {/* Product Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Product Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white"
        >
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 space-y-4"
        >
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold"
              >
                {formatBRL(product.price)}
              </motion.span>
              {product.originalPrice && (
                <span className="text-gray-400 line-through text-sm">
                  {formatBRL(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 text-sm"
          >
            {product.description}
          </motion.p>

          {/* Quantity Controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 py-2"
          >
            <motion.button
              onClick={() => updateQuantity(-1)}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg"
              disabled={quantity <= 1}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.span
              key={quantity}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="w-12 text-center text-lg font-medium"
            >
              {quantity}
            </motion.span>
            <motion.button
              onClick={() => updateQuantity(1)}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* View Cart Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 border-t"
      >
        <motion.button 
          className="w-full bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          onClick={() => {/* Handle add to cart */}}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>VIEW CART ({quantity})</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 