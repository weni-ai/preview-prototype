import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Chat } from './components/Chat';
import { AgentNode } from './components/AgentNode';
import { motion } from 'framer-motion';
import { sendChatMessage } from './services/api';
import type { Message, Trace } from './types';
import { AgentGrid } from './components/AgentGrid';
import { BotResponse } from './components/BotResponse';
import { Sparkles } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expandedTraces, setExpandedTraces] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentGrid, setShowAgentGrid] = useState(false);

  // Generate a session ID based on the current timestamp
  const sessionId = Date.now().toString();

  // Get the backend URL from environment variables, with a fallback
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      cors: {
        origin: "http://localhost:3000",
        credentials: true
      }
    });

    // Add connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    newSocket.on('response_chunk', (data: { content: string }) => {
      // Update the last assistant message with new chunks
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.type === 'assistant') {
          const updatedMessages = [...prev.slice(0, -1)];
          updatedMessages.push({
            ...lastMessage,
            text: (lastMessage.text || '') + data.content
          });
          return updatedMessages;
        }
        return prev;
      });
    });

    newSocket.on('trace_update', (data: { trace: Trace }) => {
      setTraces(prev => [...prev, data.trace]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [BACKEND_URL]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { type: 'user', text: message }]);
    setTraces([]); // Clear previous traces

    try {
      // Initialize an empty assistant message that will be updated in real-time
      setMessages(prev => [...prev, { type: 'assistant', text: '' }]);

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          sessionId: sessionId // Use the timestamp-based session ID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // The final message and traces will be updated through WebSocket events
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        text: 'Sorry, there was an error processing your request.' 
      }]);
      setTraces(prev => [...prev, {
        type: 'error',
        summary: 'Error occurred',
        failureReason: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrace = (index: number) => {
    setExpandedTraces(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyTrace = (trace: any) => {
    navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-500" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Weni Multi-Agent Preview
              </h1>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-600">Collaborative AI agents working together</p>
          </div>

          {showAgentGrid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-[400px]"
            >
              <AgentGrid 
                traces={traces}
                activeAgent={isLoading ? traces.length : -1}
              />
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px]">
              <Chat 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading}
              />
            </div>
            
            <div className="h-[400px] overflow-y-auto bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Processing Steps</h2>
              {traces.map((trace, index) => (
                <BotResponse
                  key={index}
                  message={trace.summary}
                  type={trace.type}
                  isActive={index === traces.length - 1}
                  fullTrace={trace}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;