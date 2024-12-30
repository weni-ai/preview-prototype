import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface FloatingCartButtonProps {
  onClick: () => void;
}

export function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white p-3 rounded-full shadow-lg z-50"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        </div>
      </motion.button>
    </AnimatePresence>
  );
} 