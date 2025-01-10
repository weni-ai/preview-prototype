import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Mic, Image, Send } from 'lucide-react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from '../contexts/CartContext';
import { io, Socket } from 'socket.io-client';
import { CatalogPreview } from './CatalogPreview';
import { ProductCatalog } from './ProductCatalog';
import { Cart } from './Cart';
import { OrderMessage } from './OrderMessage';
import { OrderDetails } from './OrderDetails';
import { AudioRecorder } from './AudioRecorder';
import { ImageUploader } from './ImageUploader';

const TypingAnimation = () => (
  <div className="flex space-x-2 items-center">
    <motion.div
      className="w-2 h-2 rounded-full bg-[#00DED2]"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        delay: 0
      }}
    />
    <motion.div
      className="w-2 h-2 rounded-full bg-[#00DED2]"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        delay: 0.2
      }}
    />
    <motion.div
      className="w-2 h-2 rounded-full bg-[#00DED2]"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        delay: 0.4
      }}
    />
  </div>
);

interface WebChatWidgetProps {
  iframeUrl: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
}

export function WebChatWidget({ iframeUrl }: WebChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentCatalogProducts, setCurrentCatalogProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [shouldClearImage, setShouldClearImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => {
    const timestamp = Date.now();
    return `session_${timestamp}`;
  });

  const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let socket: Socket | null = null;

    const connectSocket = () => {
      if (socket?.connected) {
        console.log('Socket already connected');
        return;
      }

      socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        extraHeaders: {
          'Access-Control-Allow-Origin': 'http://localhost:3000'
        }
      });

      socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        socket?.emit('join', { sessionId });
        console.log('Joining session:', sessionId);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });

      socket.on('response_chunk', (data: { content: string }) => {
        console.log('Received chunk in session', sessionId, ':', data);
        setCurrentResponse(prev => prev + data.content);
      });

      setSocket(socket);
    };

    connectSocket();

    return () => {
      if (socket?.connected) {
        socket.disconnect();
      }
      socket = null;
    };
  }, [BACKEND_URL, sessionId]);

  const parseProductCatalog = (text: string): Product[] | null => {
    try {
      const match = text.match(/<ProductCatalog>(.*?)<\/ProductCatalog>/s);
      if (!match) return null;

      const jsonStr = match[1].trim();
      if (!jsonStr) return null;

      // Clean up the JSON string - replace single quotes with double quotes and fix missing commas
      const cleanJsonStr = jsonStr
        .replace(/'/g, '"')
        .replace(/}(\s*){/g, '},{'); // Add missing commas between objects
      
      const products = JSON.parse(cleanJsonStr);
      if (!Array.isArray(products)) return null;

      return products.map((product: any) => ({
        id: product.id || product.productId,
        name: product.name || product.productName,
        description: product.description,
        image: product.image,
        price: parseFloat(product.price) || 0,
        sellerId: product.sellerId || "default"
      }));
    } catch (e) {
      console.error('Failed to parse product catalog:', e);
      return null;
    }
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
      items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        item_price: parseFloat(item.price),
        currency: 'USD',
        name: item.name,
        image: item.image,
        sellerId: item.sellerId || 'default'
      })),
      timestamp: new Date().toISOString(),
    };
    handleSendMessage(`<Order>${JSON.stringify(orderMessage)}</Order>`);
    setShowCart(false);
    setIsOpen(true);
  };

  const handleAudioRecorded = (text: string, audioUrl: string) => {
    if (text.trim() && !isLoading) {
      handleSendMessage(JSON.stringify({
        type: 'audio',
        text,
        audioUrl
      }));
    }
  };

  const handleImageSelected = (file: File | null) => {
    setSelectedImage(file);
    setShouldClearImage(false);
  };

  const handleViewOrderDetails = (order: any) => {
    const orderWithPrices = {
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        item_price: parseFloat(item.item_price || item.price || 0),
        sellerId: item.sellerId || 'default'
      }))
    };
    setSelectedOrder(orderWithPrices);
    setShowOrderDetails(true);
  };

  useEffect(() => {
    if (currentResponse && isLoading) {
      const products = parseProductCatalog(currentResponse);
      const order = parseOrderMessage(currentResponse);

      if (products) {
        setCurrentCatalogProducts(products);
      }

      if (order) {
        setSelectedOrder(order);
      }

      setMessages(prev => {
        // Simply append the new message
        return [...prev, {
          text: currentResponse,
          type: 'assistant',
          role: 'assistant'
        }];
      });
    }
  }, [currentResponse, isLoading]);

  const handleViewCatalog = (products: Product[]) => {
    setCurrentCatalogProducts(products);
    setShowCatalog(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setCurrentResponse('');
    setMessages(prev => [...prev, { text: message, type: 'user', role: 'user' }]);
    setInput('');

    if (selectedImage) {
      // Clear image input immediately
      const imageToSend = selectedImage;
      setSelectedImage(null);
      setShouldClearImage(true);

      const formData = new FormData();
      formData.append('image', imageToSend);

      try {
        const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.status === 'success' && data.text) {
          const imageMessage = JSON.stringify({
            type: 'image',
            text: input.trim(),
            imageUrl: `${BACKEND_URL}${data.imageUrl}`,
            imageAnalysis: data.text
          });

          try {
            const chatResponse = await fetch(`${BACKEND_URL}/api/chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                message: imageMessage,
                sessionId,
                skip_trace_summary: true
              }),
            });

            if (!chatResponse.ok) {
              throw new Error(`HTTP error! status: ${chatResponse.status}`);
            }
          } catch (error) {
            console.error('Error sending image message:', error);
            setMessages(prev => [...prev, { 
              text: 'Sorry, there was an error processing your image.', 
              type: 'assistant',
              role: 'assistant' 
            }]);
          }
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        setMessages(prev => [...prev, { 
          text: 'Sorry, there was an error analyzing your image.', 
          type: 'assistant',
          role: 'assistant' 
        }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          sessionId,
          skip_trace_summary: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages(prev => [...prev, { 
        text: 'Sorry, there was an error processing your request.', 
        type: 'assistant',
        role: 'assistant' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (message: Message) => {
    try {
      const content = JSON.parse(message.text);
      if (content.type === 'audio') {
        return (
          <div className="space-y-2">
            <audio src={content.audioUrl} controls className="w-full" />
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

    const products = parseProductCatalog(message.text);
    const order = parseOrderMessage(message.text);
    
    if (products && products.length > 0) {
      const [beforeCatalog, afterCatalog] = message.text.split(/<ProductCatalog>.*?<\/ProductCatalog>/s);
      return (
        <div className="space-y-3">
          {beforeCatalog && (
            <p className="text-base leading-relaxed whitespace-pre-wrap">{beforeCatalog.trim()}</p>
          )}
          <CatalogPreview
            products={products}
            onViewCatalog={() => handleViewCatalog(products)}
          />
          {afterCatalog && (
            <p className="text-base leading-relaxed whitespace-pre-wrap">{afterCatalog.trim()}</p>
          )}
        </div>
      );
    }

    if (order) {
      return (
        <OrderMessage
          items={order.items}
          onViewDetails={() => handleViewOrderDetails(order)}
        />
      );
    }

    // Function to convert text with URLs to JSX with clickable links
    const renderTextWithLinks = (text: string) => {
      // Regular expression to match URLs
      const urlRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const parts = text.split(urlRegex);
      
      if (parts.length === 1) {
        return <p className="text-base leading-relaxed whitespace-pre-wrap">{text}</p>;
      }

      const elements: JSX.Element[] = [];
      let currentIndex = 0;

      text.replace(urlRegex, (match, quote, url, offset) => {
        // Add text before the link
        if (offset > currentIndex) {
          elements.push(
            <span key={`text-${currentIndex}`}>
              {text.slice(currentIndex, offset)}
            </span>
          );
        }

        // Add the link
        elements.push(
          <a
            key={`link-${offset}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00DED2] hover:underline"
          >
            {url}
          </a>
        );

        currentIndex = offset + match.length;
        return match;
      });

      // Add any remaining text after the last link
      if (currentIndex < text.length) {
        elements.push(
          <span key={`text-${currentIndex}`}>
            {text.slice(currentIndex)}
          </span>
        );
      }

      return <p className="text-base leading-relaxed whitespace-pre-wrap">{elements}</p>;
    };

    return renderTextWithLinks(message.text);
  };

  return (
    <CartProvider>
      <div className="relative w-full h-screen">
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          title="Content"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
        
        <div className="fixed bottom-4 right-4 z-50">
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="bg-[#1B1D21] rounded-lg shadow-lg w-[400px] h-[600px] flex flex-col overflow-hidden"
              >
                {showCatalog ? (
                  <ProductCatalog
                    products={currentCatalogProducts}
                    onClose={() => setShowCatalog(false)}
                    onViewCart={() => {
                      setShowCatalog(false);
                      setShowCart(true);
                    }}
                  />
                ) : showOrderDetails && selectedOrder ? (
                  <OrderDetails
                    items={selectedOrder.items.map((item: any) => ({
                      ...item,
                      sellerId: item.sellerId || 'default',
                      item_price: parseFloat(item.item_price || item.price || 0)
                    }))}
                    timestamp={selectedOrder.timestamp}
                    onClose={() => {
                      setShowOrderDetails(false);
                      setSelectedOrder(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                      <h2 className="text-white font-semibold">Chat</h2>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto bg-[#1B1D21] p-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`mb-4 ${
                            message.type === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          <div
                            className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                              message.type === 'user'
                                ? 'bg-[#00DED2] text-white'
                                : 'bg-[#2A2D35] text-white'
                            }`}
                          >
                            {renderMessageContent(message)}
                          </div>
                        </div>
                      ))}
                      {isLoading && currentResponse && (
                        <div className="text-left mb-4">
                          <div className="inline-block rounded-lg px-4 py-2 bg-[#2A2D35] text-white">
                            {currentResponse}
                          </div>
                        </div>
                      )}
                      {isLoading && !currentResponse && (
                        <div className="text-left mb-4">
                          <div className="inline-block rounded-lg px-4 py-2 bg-[#2A2D35] text-white min-w-[60px]">
                            <TypingAnimation />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-[#1B1D21] border-t border-gray-800">
                      <div className="flex items-center gap-2 bg-[#2A2D35] rounded-full p-2">
                        <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                        <ImageUploader
                          onImageSelected={handleImageSelected}
                          shouldClear={shouldClearImage}
                        />
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                              handleSendMessage(input);
                            }
                          }}
                          placeholder="Type your message..."
                          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 px-2"
                        />
                        <button
                          onClick={() => handleSendMessage(input)}
                          disabled={!input.trim() || isLoading}
                          className="p-2 rounded-full bg-[#00DED2] hover:bg-[#00C4BA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsOpen(true)}
                className="bg-[#00DED2] text-white p-4 rounded-full shadow-lg hover:bg-[#00C4BA] transition-colors"
              >
                <MessageCircle size={24} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <Cart
                onClose={() => {
                  setShowCart(false);
                  setIsOpen(true);
                }}
                onPlaceOrder={handlePlaceOrder}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CartProvider>
  );
} 