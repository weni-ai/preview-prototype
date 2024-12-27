import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Message } from '../types';

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
  const [input, setInput] = useState('');
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

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-white border border-gray-100 shadow-sm text-gray-800'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl transition-all flex items-center gap-2
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