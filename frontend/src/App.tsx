import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Chat } from './components/Chat';
import { AgentNode } from './components/AgentNode';
import { motion } from 'framer-motion';
import { sendChatMessage } from './services/api';
import type { Message, Trace } from './types';
import { AgentGrid } from './components/AgentGrid';
import { BotResponse } from './components/BotResponse';
import { OrchestrationView } from './components/OrchestrationView';
import { Sparkles } from 'lucide-react';
import { OrchestrationFlow } from './components/OrchestrationFlow';
import { CartProvider } from './contexts/CartContext';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expandedTraces, setExpandedTraces] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'logs'>('visual');

  // Generate a session ID once and store it in state
  const [sessionId] = useState(() => {
    const timestamp = Date.now();
    return `session_${timestamp}`;
  });

  // Get the backend URL from environment variables, with a fallback
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

  // Fetch collaborators on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/collaborators`)
      .then(response => response.json())
      .then(data => {
        const allCollaborators = [
          data.manager,
          ...data.collaborators.sort((a: any, b: any) => a.name.localeCompare(b.name))
        ];
        setCollaborators(allCollaborators);
      })
      .catch(error => console.error('Error fetching collaborators:', error));
  }, [BACKEND_URL]);

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
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                text: lastMessage.text + data.content
              }
            ];
          }
          return prev;
        });
      });

      socket.on('trace_update', (data: { trace: Trace }) => {
        console.log('Received trace in session', sessionId, ':', data);
        setTraces(prev => [...prev, data.trace]);
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
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#00DED2]/5 via-white to-[#00DED2]/10">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-[1400px] mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-7 h-7 text-[#00DED2]" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80">
                  Weni Multi-Agent Preview
                </h1>
                <Sparkles className="w-7 h-7 text-[#00DED2]" />
              </div>
              <p className="text-gray-600">Collaborative AI agents working together</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
              <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col h-full">
                <Chat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm flex flex-col h-full">
                <div className="flex border-b">
                  <button
                    className={`px-4 py-2 ${
                      activeTab === 'visual'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('visual')}
                  >
                    Visual Flow
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === 'logs'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('logs')}
                  >
                    Logs
                  </button>
                </div>
                {activeTab === 'visual' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <OrchestrationFlow 
                      traces={traces} 
                      collaborators={collaborators}
                    />
                  </motion.div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto p-4">
                    {traces.map((trace, index) => (
                      <AgentNode
                        key={index}
                        type={trace.type === 'PRE_PROCESSING' ? 'Pre-processing' :
                             trace.type === 'ORCHESTRATION' ? 'Orchestration' :
                             trace.type === 'POST_PROCESSING' ? 'Post-processing' :
                             trace.type === 'error' ? 'Error' : 'Processing'}
                        status={index === traces.length - 1 ? 'active' : 'completed'}
                        summary={trace.summary || 'Processing...'}
                        details={trace}
                        isExpanded={expandedTraces.has(index)}
                        onToggle={() => toggleTrace(index)}
                        onCopy={() => copyTrace(trace)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CartProvider>
  );
}

export default App;