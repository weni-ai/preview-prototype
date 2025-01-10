import React, { useState, useRef, useEffect } from 'react';
import { Send, Play, Pause } from 'lucide-react';
import type { Message } from '../types';
import { CatalogPreview } from './CatalogPreview';
import { ProductCatalog } from './ProductCatalog';
import { FloatingCartButton } from './FloatingCartButton';
import { Cart } from './Cart';
import { OrderMessage } from './OrderMessage';
import { OrderDetails } from './OrderDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioRecorder } from './AudioRecorder';
import { ImageUploader } from './ImageUploader';
import { URLButton } from './URLButton';

const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

interface AudioMessage {
  text: string;
  audioUrl: string;
}

export function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
  const [input, setInput] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentCatalogProducts, setCurrentCatalogProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [shouldClearImage, setShouldClearImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSending) return;

    setIsSending(true);

    if (selectedImage) {
      const formData = new FormData();
      formData.append('image', selectedImage);

      try {
        const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.status === 'success' && data.text) {
          onSendMessage(JSON.stringify({
            type: 'image',
            text: input.trim(),
            imageUrl: `${BACKEND_URL}${data.imageUrl}`,
            imageAnalysis: data.text
          }));
          // Clear inputs only after successful analysis
          setSelectedImage(null);
          setInput('');
          setShouldClearImage(true);
        } else {
          console.error('Image analysis failed:', data.error);
        }
      } catch (error) {
        console.error('Error sending image for analysis:', error);
      } finally {
        setIsSending(false);
      }
    } else if (input.trim()) {
      onSendMessage(input);
      setInput('');
      setIsSending(false);
    } else {
      setIsSending(false);
    }
  };

  const handleAudioRecorded = (text: string, audioUrl: string) => {
    if (text.trim() && !isLoading) {
      onSendMessage(JSON.stringify({
        type: 'audio',
        text,
        audioUrl
      }));
    }
  };

  const toggleAudioPlayback = (audioUrl: string) => {
    const audio = audioRefs.current[audioUrl];
    if (!audio) return;

    if (playingAudio === audioUrl) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Pause any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      audio.play();
      setPlayingAudio(audioUrl);
    }
  };

  const parseProductCatalog = (text: string): Product[] | null => {
    const match = text.match(/<ProductCatalog>(.*?)<\/ProductCatalog>/s);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        // Fix common JSON formatting issues
        const fixedJsonStr = jsonStr
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Add quotes around property names
        return JSON.parse(fixedJsonStr);
      } catch (e) {
        console.error('Failed to parse product catalog:', e);
        return null;
      }
    }
    return null;
  };

  const parseOrderMessage = (text: string): any | null => {
    const match = text.match(/<Order>(.*?)<\/Order>/s);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        const order = JSON.parse(jsonStr);
        // Ensure all items have the required fields
        if (order.items) {
          order.items = order.items.map((item: any) => ({
            ...item,
            name: item.name || item.productName || 'Unknown Product',
            item_price: item.price || item.item_price || 0,
            total: item.quantity * (item.price || item.item_price || 0)
          }));
          // Recalculate total if not present
          if (!order.total) {
            order.total = order.items.reduce((sum: number, item: any) => sum + item.total, 0);
          }
        }
        return order;
      } catch (e) {
        console.error('Failed to parse order:', e);
        return null;
      }
    }
    return null;
  };

  const handlePlaceOrder = (items: any[]) => {
    const orderMessage = {
      items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        image: item.image,
        sellerId: item.sellerId,
        name: item.name || item.productName,
        item_price: item.price,
        total: item.quantity * item.price
      })),
      timestamp: new Date().toISOString(),
      total: items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    };
    onSendMessage(`<Order>${JSON.stringify(orderMessage)}</Order>`);
  };

  const handleImageAnalyzed = (text: string, imageUrl: string) => {
    if (text.trim() && !isLoading) {
      onSendMessage(JSON.stringify({
        type: 'image',
        text,
        imageUrl
      }));
    }
  };

  const handleImageSelected = (file: File | null) => {
    setSelectedImage(file);
    setShouldClearImage(false);
  };

  const replaceRedactedWithOrderForm = (text: string) => {
    return text.replace(/<REDACTED>/g, 'orderForm');
  };

  const renderMessageContent = (message: Message) => {
    const processedText = replaceRedactedWithOrderForm(message.text);
    
    try {
      const content = JSON.parse(processedText);
      if (content.type === 'audio') {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAudioPlayback(content.audioUrl)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {playingAudio === content.audioUrl ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <audio
                ref={(el) => {
                  if (el) {
                    audioRefs.current[content.audioUrl] = el;
                    el.onended = () => setPlayingAudio(null);
                  }
                }}
                src={content.audioUrl}
                preload="none"
              />
            </div>
            <p className="text-sm opacity-90">{content.text}</p>
          </div>
        );
      }
      
      if (content.type === 'image') {
        return (
          <div className="space-y-3">
            {content.text && (
              <p className="text-base leading-relaxed whitespace-pre-wrap mb-2">{content.text}</p>
            )}
            <img
              src={content.imageUrl}
              alt="Uploaded image"
              className="max-w-[300px] rounded-lg shadow-sm"
            />
          </div>
        );
      }
    } catch (e) {
      // Not a special message type, continue with normal message handling
    }

    // Check for URL button format
    const urlButtonMatch = processedText.match(/(.*?)<URLButton>\[(.*?)\]\((.*?)\)<\/URLButton>/s);
    if (urlButtonMatch) {
      const [_, text, buttonText, url] = urlButtonMatch;
      return <URLButton text={text.trim()} buttonText={buttonText} url={url} />;
    }

    const products = parseProductCatalog(processedText);
    const order = parseOrderMessage(processedText);
    
    if (products) {
      const textBeforeCatalog = processedText.split('<ProductCatalog>')[0].trim();
      return (
        <div className="space-y-3">
          {textBeforeCatalog && (
            <p className="text-base leading-relaxed whitespace-pre-wrap">{textBeforeCatalog}</p>
          )}
          <CatalogPreview
            products={products}
            onViewCatalog={() => {
              setCurrentCatalogProducts(products);
              setShowCatalog(true);
            }}
          />
        </div>
      );
    }

    if (order) {
      return (
        <OrderMessage
          items={order.items}
          onViewDetails={() => {
            setSelectedOrder(order);
            setShowOrderDetails(true);
          }}
        />
      );
    }

    return <p className="text-base leading-relaxed whitespace-pre-wrap">{processedText}</p>;
  };

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence mode="wait">
        {showCatalog ? (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute inset-0 bg-white z-10"
          >
            <ProductCatalog
              products={currentCatalogProducts}
              onClose={() => setShowCatalog(false)}
              onViewCart={() => {
                setShowCatalog(false);
                setShowCart(true);
              }}
            />
          </motion.div>
        ) : showOrderDetails && selectedOrder ? (
          <motion.div
            key="order-details"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute inset-0 bg-white z-10"
          >
            <OrderDetails
              items={selectedOrder.items}
              timestamp={selectedOrder.timestamp}
              onClose={() => {
                setShowOrderDetails(false);
                setSelectedOrder(null);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="flex flex-col h-full relative"
          >
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white'
                            : 'bg-white border border-gray-100 shadow-sm text-gray-800'
                        }`}
                      >
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="flex-none p-3 border-t bg-white">
                <div className="flex gap-3 items-center">
                  <AudioRecorder onAudioRecorded={handleAudioRecorded} isLoading={isLoading} />
                  <ImageUploader 
                    onImageAnalyzed={handleImageAnalyzed} 
                    isLoading={isLoading} 
                    onImageSelected={handleImageSelected}
                    shouldClear={shouldClearImage}
                    isSending={isSending}
                  />
                  <form onSubmit={handleSubmit} className="flex flex-1 gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={selectedImage ? "What would you like to know about this image?" : "Type your message..."}
                      className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00DED2] bg-gray-50"
                      disabled={isLoading || isSending}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || isSending || (!input.trim() && !selectedImage)}
                      className={`px-4 py-2 bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white rounded-xl transition-all flex items-center gap-2
                        ${(isLoading || isSending || (!input.trim() && !selectedImage)) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
                    >
                      <span>{isLoading || isSending ? 'Sending...' : 'Send'}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 z-20">
        <FloatingCartButton onClick={() => setShowCart(true)} />
      </div>

      {showCart && (
        <div className="absolute inset-0 bg-black/50 z-30 flex items-center justify-center">
          <Cart
            onClose={() => setShowCart(false)}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      )}
    </div>
  );
}