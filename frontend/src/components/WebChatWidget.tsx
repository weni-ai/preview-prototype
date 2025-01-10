import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Mic, Image, Send } from 'lucide-react';
import { Chat } from './Chat';
import { Message } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from '../contexts/CartContext';
import { io, Socket } from 'socket.io-client';

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

export function WebChatWidget({ iframeUrl }: WebChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId] = useState(() => {
    const timestamp = Date.now();
    return `session_${timestamp}`;
  });

  // Get the backend URL from runtime configs, environment variables, or fallback
  const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

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

  // Effect to update messages when currentResponse changes
  useEffect(() => {
    if (currentResponse && isLoading) {
      setMessages(prev => {
        const withoutLastAssistant = prev.filter(msg => msg.type !== 'assistant');
        return [...withoutLastAssistant, {
          text: currentResponse,
          type: 'assistant',
          role: 'assistant'
        }];
      });
    }
  }, [currentResponse, isLoading]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setCurrentResponse('');
    setMessages(prev => [...prev, { text: message, type: 'user', role: 'user' }]);
    setInput('');
    
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

  return (
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
                      {message.text}
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
              </div>

              <div className="p-4 bg-[#1B1D21] border-t border-gray-800">
                <div className="flex items-center gap-2 bg-[#2A2D35] rounded-full p-2">
                  <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <Mic className="w-6 h-6 text-[#00DED2]" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <Image className="w-6 h-6 text-[#00DED2]" />
                  </button>
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
    </div>
  );
} 