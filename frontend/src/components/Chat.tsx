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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
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
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse product catalog:', e);
      }
    }
    return null;
  };

  const parseOrderMessage = (text: string): any | null => {
    const match = text.match(/<Order>(.*?)<\/Order>/s);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse order:', e);
      }
    }
    return null;
  };

  const handlePlaceOrder = (items: any[]) => {
    const orderMessage = {
      items,
      timestamp: new Date().toISOString(),
    };
    onSendMessage(`<Order>${JSON.stringify(orderMessage)}</Order>`);
  };

  const renderMessageContent = (message: Message) => {
    try {
      const content = JSON.parse(message.text);
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
    } catch (e) {
      // Not an audio message, continue with normal message handling
    }

    const products = parseProductCatalog(message.text);
    const order = parseOrderMessage(message.text);
    
    if (products) {
      const textBeforeCatalog = message.text.split('<ProductCatalog>')[0].trim();
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

    return <p className="text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>;
  };

  return (
    <div className="flex flex-col flex-1 relative">
      <AnimatePresence mode="wait">
        {showCatalog ? (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute inset-0 bg-white"
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
            className="absolute inset-0 bg-white"
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
            className="flex flex-col flex-1"
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

            <form onSubmit={handleSubmit} className="p-3 border-t bg-white rounded-b-xl">
              <div className="flex gap-3 items-center">
                <AudioRecorder onAudioRecorded={handleAudioRecorded} isLoading={isLoading} />
                <div className="flex flex-1 gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00DED2] bg-gray-50"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-4 py-2 bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80 text-white rounded-xl transition-all flex items-center gap-2
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
                  >
                    <span>{isLoading ? 'Sending...' : 'Send'}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingCartButton onClick={() => setShowCart(true)} />
      {showCart && (
        <Cart
          onClose={() => setShowCart(false)}
          onPlaceOrder={handlePlaceOrder}
        />
      )}
    </div>
  );
}