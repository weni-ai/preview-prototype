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

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expandedTraces, setExpandedTraces] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'logs'>('visual');

  // Generate a session ID based on the current timestamp
  const sessionId = Date.now().toString();

  // Get the backend URL from environment variables, with a fallback
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

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
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': 'http://localhost:3000'
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
    <div className="min-h-screen bg-gradient-to-br from-[#00DED2]/5 via-white to-[#00DED2]/10">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-[#00DED2]" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80">
                Weni Multi-Agent Preview
              </h1>
              <Sparkles className="w-6 h-6 text-[#00DED2]" />
            </div>
            <p className="text-gray-600 text-sm">Collaborative AI agents working together</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col min-h-[500px]">
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm flex flex-col min-h-[500px]">
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
  );
}

export default App;