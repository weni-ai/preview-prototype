import React, { useState, useEffect } from 'react';
import { Container, Grid } from '@mui/material';
import Chat from './components/Chat';
import AgentPanel from './components/AgentPanel';
import axios from 'axios';
import io from 'socket.io-client';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [traces, setTraces] = useState([]);
  const [socket, setSocket] = useState(null);
  
  // Get the backend URL from environment variables, with a fallback
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    // Use BACKEND_URL in socket connection
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

    newSocket.on('response_chunk', (data) => {
      // Update the last assistant message with new chunks
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.type === 'agent') {
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

    newSocket.on('trace_update', (data) => {
      setTraces(prev => [...prev, data.trace]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleSendMessage = async (text) => {
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text }]);
    
    // Clear previous traces for new conversation
    setTraces([]);

    try {
      // Initialize an empty agent message that will be updated in real-time
      setMessages(prev => [...prev, { type: 'agent', text: '' }]);

      // Use BACKEND_URL in axios request
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: text,
        sessionId: 'test-session'
      }, {
        // Add these headers and settings
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });

      // The final message and traces will be updated through WebSocket events
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'agent', 
        text: 'Sorry, there was an error processing your request.' 
      }]);
      setTraces(prev => [...prev, {
        failureReason: error.message || 'Unknown error occurred'
      }]);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 4 }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        <Grid item xs={12} md={8}>
          <AgentPanel traces={traces} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Chat onSendMessage={handleSendMessage} messages={messages} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default App; 