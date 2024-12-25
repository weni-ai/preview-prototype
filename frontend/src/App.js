import React, { useState } from 'react';
import { Container, Grid } from '@mui/material';
import Chat from './components/Chat';
import AgentPanel from './components/AgentPanel';
import axios from 'axios';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [traces, setTraces] = useState([]);

  const handleSendMessage = async (text) => {
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text }]);

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/chat', {
        message: text,
        sessionId: 'test-session'
      });

      // Add agent message
      setMessages(prev => [...prev, { type: 'agent', text: response.data.message }]);
      
      // Update traces - handle the structured trace data
      if (response.data.traces) {
        setTraces(response.data.traces);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'agent', 
        text: 'Sorry, there was an error processing your request.' 
      }]);
      // Add error trace
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