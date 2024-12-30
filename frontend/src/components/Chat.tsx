import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Message } from '../types';
import { CatalogPreview } from './CatalogPreview';
import { ProductCatalog } from './ProductCatalog';

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

export function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
  const [input, setInput] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [currentCatalogProducts, setCurrentCatalogProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const renderMessageContent = (message: Message) => {
    const products = parseProductCatalog(message.text);
    
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

    return <p className="text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>;
  };

  if (showCatalog) {
    return (
      <div className="flex flex-col flex-1">
        <ProductCatalog
          products={currentCatalogProducts}
          onClose={() => setShowCatalog(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
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
        <div className="flex gap-3">
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
      </form>
    </div>
  );
}