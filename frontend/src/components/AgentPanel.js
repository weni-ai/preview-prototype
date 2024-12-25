import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  IconButton,
  Collapse,
  Button,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const getSummary = (trace) => {
  return trace.summary || "Processing step";
};

const TraceContent = ({ trace }) => {
  const [expanded, setExpanded] = useState(false);

  const handleCopyTrace = () => {
    navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body1" sx={{ flex: 1 }}>
          {trace.summary || 'Processing step'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title={expanded ? "Collapse full trace" : "Expand full trace"}>
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <KeyboardArrowUpIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy full trace">
            <IconButton size="small" onClick={handleCopyTrace}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {trace.modelInvocationOutput?.rationale?.text && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Rationale:</strong> {trace.modelInvocationOutput.rationale.text}
            </Typography>
          )}
          {trace.modelInvocationOutput?.observation?.finalResponse?.text && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Response:</strong> {trace.modelInvocationOutput.observation.finalResponse.text}
            </Typography>
          )}
          {trace.modelInvocationInput?.text && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Input:</strong> {trace.modelInvocationInput.text}
            </Typography>
          )}
        </Box>
        <Box 
          sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1,
            maxHeight: '400px',
            overflow: 'auto'
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Full Trace:
          </Typography>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(trace, null, 2)}
          </pre>
        </Box>
      </Collapse>
    </Box>
  );
};

const AgentPanel = ({ traces }) => {
  return (
    <Paper elevation={3} sx={{ height: '100%', p: 2, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Agent Orchestration
      </Typography>
      <Stepper orientation="vertical">
        {traces.map((trace, index) => (
          <Step key={index} active={true} completed={index < traces.length - 1}>
            <StepLabel>
              <Typography variant="subtitle2" color="primary">
                {trace.type || 'Processing Step'}
              </Typography>
            </StepLabel>
            <StepContent>
              <TraceContent trace={trace} />
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default AgentPanel; 