import React from 'react';
import { motion } from 'framer-motion';
import { AgentIcon } from './AgentIcon';
import { AgentInfo } from './AgentInfo';
import { ThinkingMessage } from './ThinkingMessage';
import styles from './Agent.module.css';

interface AgentProps {
  name: string;
  role: string;
  avatar?: string;
  isThinking?: boolean;
}

export const Agent: React.FC<AgentProps> = ({
  name,
  role,
  avatar,
  isThinking = false,
}) => {
  return (
    <motion.div 
      className={styles.agentCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.agentHeader}>
        <AgentIcon avatar={avatar} />
        <AgentInfo name={name} role={role} />
      </div>
      {isThinking && (
        <div className={styles.thinkingContainer}>
          <ThinkingMessage />
        </div>
      )}
    </motion.div>
  );
}; 