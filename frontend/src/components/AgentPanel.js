import React from 'react';
import { Paper, Typography, Box, Stepper, Step, StepLabel } from '@mui/material';

const AgentPanel = ({ traces }) => {
  return (
    <Paper elevation={3} sx={{ height: '100%', p: 2, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Agent Orchestration
      </Typography>
      <Stepper orientation="vertical">
        {traces.map((trace, index) => (
          <Step key={index} active={true}>
            <StepLabel>
              <Typography variant="subtitle2">
                {trace.type}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {JSON.stringify(trace.payload, null, 2)}
                </Typography>
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default AgentPanel; 