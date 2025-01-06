import React from 'react';
import { ChevronLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { formatBRL } from '../utils/currency';
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
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const { items, addItem, updateQuantity: updateCartQuantity } = useCart();

  const getProductQuantity = (productId: string) => {
    const cartItem = items.find(item => item.id === productId);
    return cartItem?.quantity || 0;
  };

  const handleQuantityChange = (product: Product, delta: number) => {
    console.log('Product being added:', product);
    const currentQuantity = getProductQuantity(product.id);
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0) {
      updateCartQuantity(product.id, 0);
    } else if (currentQuantity === 0 && delta > 0) {
      addItem({
        ...product,
        quantity: 1,
        product_retailer_id: product.id,
        sellerId: product.sellerId
      });
    } else {
      updateCartQuantity(product.id, newQuantity);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence mode="wait">
      {selectedProduct ? (
        <ProductDetail
          key="product-detail"
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(quantity) => {
            addItem({
              ...selectedProduct,
              quantity,
              product_retailer_id: selectedProduct.id,
              sellerId: "default"
            });
            setSelectedProduct(null);
          }}
          initialQuantity={getProductQuantity(selectedProduct.id)}
        />
      ) : (
        <motion.div
          key="product-catalog"
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
            <div>
              <h1 className="text-lg font-semibold">Product Catalog</h1>
              <p className="text-sm opacity-90">Browse our products</p>
            </div>
            <button onClick={onViewCart} className="ml-auto relative">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
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
                      <p className="text-[#00DED2] font-semibold">{formatBRL(product.price)}</p>
                      {product.originalPrice && (
                        <span className="text-gray-400 line-through text-sm">
                          {formatBRL(product.originalPrice)}
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
  );
} 