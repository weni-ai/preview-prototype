import React from 'react';
import { ChevronLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { ProductDetail } from './ProductDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice?: number;
  sellerId: string;
}

interface ProductCatalogProps {
  products: Product[];
  onClose: () => void;
  onViewCart: () => void;
}

export function ProductCatalog({ products, onClose, onViewCart }: ProductCatalogProps) {
  const { addToCart, removeFromCart, getProductQuantity } = useCart();
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const totalItems = products.reduce((sum, product) => sum + getProductQuantity(product.id), 0);

  const handleQuantityChange = (product: Product, delta: number) => {
    if (delta > 0) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        sellerId: product.sellerId
      });
    } else {
      removeFromCart(product.id);
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
      <AnimatePresence mode="wait">
        {selectedProduct ? (
          <ProductDetail
            key="product-detail"
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={(quantity) => {
              for (let i = 0; i < quantity; i++) {
                addToCart({
                  id: selectedProduct.id,
                  name: selectedProduct.name,
                  price: selectedProduct.price,
                  image: selectedProduct.image,
                  sellerId: selectedProduct.sellerId
                });
              }
              setSelectedProduct(null);
            }}
            initialQuantity={getProductQuantity(selectedProduct.id)}
          />
        ) : (
          <motion.div
            key="product-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white p-4 flex items-center gap-4">
              <button onClick={onClose} className="p-1">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold flex-1">Product Catalog</h1>
              {totalItems > 0 && (
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-white text-[#00DED2] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {totalItems}
                  </span>
                </div>
              )}
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-b p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedProduct(product)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex gap-4">
                    <motion.img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-[#00DED2] font-semibold">{formatCurrency(product.price)}</p>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <motion.div 
                    className="flex items-center justify-end mt-2 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <motion.button
                      onClick={() => handleQuantityChange(product, -1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      disabled={!getProductQuantity(product.id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>
                    <span className="w-8 text-center">{getProductQuantity(product.id)}</span>
                    <motion.button
                      onClick={() => handleQuantityChange(product, 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* View Cart Button */}
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 border-t"
                >
                  <motion.button
                    onClick={onViewCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white py-3 rounded-lg font-medium"
                  >
                    VIEW CART
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 