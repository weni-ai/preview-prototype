import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, MessageSquare, ArrowRight, Activity } from 'lucide-react';
import styles from './OrchestrationFlow.module.css';

interface OrchestrationFlowProps {
  traces: any[];
  collaborators: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'waiting' | 'completed';
  summary?: string;
  description?: string;
}

interface MessageBubble {
  message: string;
  position: {
    top: number;
    left: number;
  };
  isManager: boolean;
  isEven: boolean;
}

export function OrchestrationFlow({ traces, collaborators }: OrchestrationFlowProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [messageBubbles, setMessageBubbles] = useState<Record<string, MessageBubble>>({});

  // Initialize agents from collaborators immediately
  useEffect(() => {
    if (collaborators.length > 0) {
      const sortedCollaborators = [...collaborators].sort((a, b) => {
        if (a.type === 'MANAGER') return -1;
        if (b.type === 'MANAGER') return 1;
        return a.name.localeCompare(b.name);
      });

      const initialAgents = sortedCollaborators.map(collaborator => ({
        id: collaborator.id,
        name: collaborator.name,
        type: collaborator.type,
        status: 'waiting' as const,
        description: collaborator.description
      }));
      setAgents(initialAgents);
    }
  }, [collaborators]);

  // Update agent statuses based on traces
  useEffect(() => {
    if (traces.length > 0 && agents.length > 0) {
      const lastTrace = traces[traces.length - 1];

      if (lastTrace.callerChain) {
        // Get the last agent's full ARN
        const lastAgent = lastTrace.callerChain[lastTrace.callerChain.length - 1];
        const activeAgentId = lastAgent.agentAliasArn;
        
        setActiveAgent(activeAgentId);

        const updatedAgents = agents.map(agent => {
          // Find if this agent is in the current caller chain by matching the full ARN
          const callerIndex = lastTrace.callerChain.findIndex(
            (caller: any) => caller.agentAliasArn === agent.id
          );

          if (callerIndex === -1) {
            // Agent not in chain, keep as waiting
            return agent.status === 'waiting' ? agent : { ...agent, status: 'waiting' as const };
          } else if (callerIndex === lastTrace.callerChain.length - 1) {
            // Last agent in chain is active
            return agent.status === 'active' && agent.summary === lastTrace.summary ? 
              agent : 
              {
                ...agent,
                status: 'active' as const,
                summary: lastTrace.summary
              };
          } else {
            // Previous agents in chain are completed
            return agent.status === 'completed' && !agent.summary ? 
              agent : 
              {
                ...agent,
                status: 'completed' as const,
                summary: undefined
              };
          }
        });

        // Only update if there are actual changes
        const hasChanges = updatedAgents.some((agent, index) => {
          const oldAgent = agents[index];
          return agent.status !== oldAgent.status || agent.summary !== oldAgent.summary;
        });

        if (hasChanges) {
          setAgents(updatedAgents);
        }
      }
    }
  }, [traces, agents]);

  // Update message bubble positions
  useEffect(() => {
    const updateBubblePositions = () => {
      const container = document.querySelector(`.${styles.container}`);
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      
      agents.forEach((agent) => {
        if (agent.status === 'active' && agent.summary) {
          const isManager = agent.type === 'MANAGER';
          const index = agents.findIndex(a => a.id === agent.id);
          
          const cardElement = container.querySelector(`[data-agent-id="${agent.id}"]`);
          if (cardElement) {
            const rect = cardElement.getBoundingClientRect();
            const isEven = index % 2 === 0;
            
            const position = {
              top: rect.bottom - containerRect.top - 25, // Always align to bottom of card
              left: rect.left + (rect.width / 2) - containerRect.left - 100, // Always center horizontally
            };
            
            setMessageBubbles(prev => ({
              ...prev,
              [agent.id]: { 
                message: agent.summary || '', 
                position,
                isManager,
                isEven
              }
            }));
          }
        } else {
          // Remove bubble if agent is not active
          setMessageBubbles(prev => {
            const { [agent.id]: removed, ...rest } = prev;
            return rest;
          });
        }
      });
    };

    // Update positions initially
    updateBubblePositions();

    // Update positions on window resize
    window.addEventListener('resize', updateBubblePositions);
    
    return () => {
      window.removeEventListener('resize', updateBubblePositions);
    };
  }, [agents]);

  const getIconForType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MANAGER':
        return <Brain className="w-8 h-8 text-white" />;
      default:
        return <MessageSquare className="w-8 h-8 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-[#00DED2] to-[#00DED2]/80';
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getMessageBubbleAnimation = (isManager: boolean, index: number) => {
    if (isManager) {
      return {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 }
      };
    }
    
    // For collaborators, animate from the sides
    const isEven = index % 2 === 0;
    return {
      initial: { opacity: 0, x: isEven ? 10 : -10 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: isEven ? -10 : 10 }
    };
  };

  const renderAgent = (agent: Agent, isManager: boolean = false, index: number = 0) => {
    const CardComponent = isManager ? styles.managerCard : styles.collaboratorCard;
    const isActive = agent.status === 'active';
    
    return (
      <motion.div
        data-agent-id={agent.id}
        className={CardComponent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isActive ? 1.05 : 1,
          transition: {
            scale: {
              duration: 0.2,
              ease: "easeInOut"
            }
          }
        }}
        whileHover={{ scale: 1.02 }}
      >
        <div className={`${styles.iconContainer} ${getStatusColor(agent.status)}`}>
          {getIconForType(agent.type)}
          {isActive && (
            <motion.div
              className={styles.pulseRing}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ 
                scale: [1, 1.5],
                opacity: [0.5, 0]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          )}
        </div>
        <div className={styles.agentInfo}>
          <h3 className={styles.agentName}>{agent.name}</h3>
          <p className={styles.agentDescription}>{agent.description}</p>
        </div>
      </motion.div>
    );
  };

  const managerAgent = agents.find(agent => agent.type === 'MANAGER');
  const collaboratorAgents = agents.filter(agent => agent.type !== 'MANAGER');

  return (
    <div className={styles.container}>
      <div className={styles.agentsFlow}>
        <AnimatePresence mode="wait">
          {agents.length > 0 && (
            <>
              {managerAgent && (
                <div className={styles.managerSection}>
                  {renderAgent(managerAgent, true, 0)}
                </div>
              )}
              <div className={styles.collaboratorsGrid}>
                {collaboratorAgents.map((agent, index) => (
                  <React.Fragment key={agent.id}>
                    {renderAgent(agent, false, index)}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Render message bubbles at root level */}
      <AnimatePresence>
        {Object.entries(messageBubbles).map(([agentId, { message, position, isManager }]) => {
          const agent = agents.find(a => a.id === agentId);
          if (!agent || agent.status !== 'active') return null;
          
          const bubbleAnimation = getMessageBubbleAnimation(isManager, agents.findIndex(a => a.id === agentId));
          
          return (
            <motion.div
              key={agentId}
              className={styles.messageBubble}
              initial={bubbleAnimation.initial}
              animate={bubbleAnimation.animate}
              exit={bubbleAnimation.exit}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, 12px)' // Same transform for all bubbles
              }}
            >
              <p className={styles.messageBubbleContent}>{message}</p>
              <div className={styles.statusIndicator}>
                <Activity className="w-3 h-3 text-[#00DED2] animate-pulse" />
                <span className="text-xs text-[#00DED2]">Processing</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
} 