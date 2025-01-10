import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
import { WebChatWidget } from './components/WebChatWidget';

function MainApp() {
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

  // Get the backend URL from runtime configs, environment variables, or fallback
  const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

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
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-none p-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-semibold">Preview Prototype</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 bg-gray-50">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col h-full overflow-hidden">
                <Chat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </div>
              <div className="bg-white rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
                <div className="flex border-b flex-none">
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
                    className="flex-1 overflow-auto"
                  >
                    <OrchestrationFlow 
                      traces={traces} 
                      collaborators={collaborators}
                    />
                  </motion.div>
                ) : (
                  <div className="flex-1 overflow-auto p-4">
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route 
          path="/iframe-chat" 
          element={<WebChatWidget iframeUrl="https://www.demoaccount19.com/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;