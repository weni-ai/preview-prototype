import React from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../Agent';
import { CollaborationLines } from './CollaborationLines';
import styles from './AgentGrid.module.css';

interface AgentGridProps {
  agents: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    isThinking?: boolean;
  }>;
  onAgentClick?: (agentId: string) => void;
}

export const AgentGrid: React.FC<AgentGridProps> = ({ agents, onAgentClick }) => {
  return (
    <motion.div 
      className={styles.gridContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <CollaborationLines agents={agents} />
      <div className={styles.agentsGrid}>
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAgentClick?.(agent.id)}
          >
            <Agent
              name={agent.name}
              role={agent.role}
              avatar={agent.avatar}
              isThinking={agent.isThinking}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 