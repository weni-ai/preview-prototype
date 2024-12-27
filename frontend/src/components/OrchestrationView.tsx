import React, { useEffect, useState } from 'react';
import { Brain, HelpCircle, ArrowRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Collaborator {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface Manager {
  name: string;
  description: string;
  type: string;
}

interface OrchestrationViewProps {
  traces: any[];
}

export function OrchestrationView({ traces }: OrchestrationViewProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [activeTrace, setActiveTrace] = useState<any | null>(null);

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/collaborators');
        if (!response.ok) {
          throw new Error('Failed to fetch collaborators');
        }
        const data = await response.json();
        setCollaborators(data.collaborators);
        setManager(data.manager);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, []);

  useEffect(() => {
    if (traces.length > 0) {
      const lastTrace = traces[traces.length - 1];
      setActiveTrace(lastTrace);

      if (lastTrace.type === 'ORCHESTRATION') {
        const observation = lastTrace.modelInvocationOutput?.observation;
        if (observation?.type === 'ACTION_GROUP') {
          const actionGroup = observation.actionGroupInvocation?.actionGroupName;
          setActiveAgent(actionGroup);
        }
      } else if (lastTrace.type === 'PRE_PROCESSING') {
        setActiveAgent('manager');
      }
    }
  }, [traces]);

  const getIconForType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MANAGER':
        return <Brain className="w-8 h-8 text-white" />;
      default:
        return <HelpCircle className="w-8 h-8 text-white" />;
    }
  };

  const renderTraceAnimation = () => {
    if (!activeTrace) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTrace.type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
        >
          {activeAgent && activeAgent !== 'manager' && (
            <motion.div
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <ArrowRight className="w-6 h-6 text-indigo-500" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderActiveMessage = () => {
    if (!activeTrace) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTrace.type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 max-w-md w-full mx-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {activeTrace.type === 'ORCHESTRATION' ? 'Orchestrating' : 'Processing'}
              </div>
              <p className="text-sm text-gray-600 break-words">
                {activeTrace.summary}
              </p>
              {activeTrace.type === 'ORCHESTRATION' && activeTrace.modelInvocationOutput?.rationale && (
                <div className="mt-2 text-xs text-gray-500">
                  {activeTrace.modelInvocationOutput.rationale.text}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col items-center h-full pt-8 relative">
      {manager && (
        <motion.div 
          className="mb-20 relative"
          animate={{
            scale: activeAgent === 'manager' ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-2xl bg-purple-500 flex items-center justify-center mb-4 shadow-lg relative`}>
              {getIconForType('MANAGER')}
              {activeAgent === 'manager' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-indigo-400"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <h3 className="text-2xl font-semibold">{manager.name}</h3>
            <p className="text-base text-gray-500 mt-2">{manager.description}</p>
          </div>
          {collaborators.length > 0 && (
            <div className="absolute w-px h-20 bg-gray-200 left-1/2 -bottom-20 transform -translate-x-1/2" />
          )}
        </motion.div>
      )}

      {collaborators.length > 0 && (
        <div className="w-full px-4">
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-full h-px">
              <div className="w-[80%] h-px bg-gray-200 mx-auto" />
            </div>
            {collaborators.map((collaborator) => (
              <motion.div
                key={collaborator.id}
                className="flex flex-col items-center relative"
                animate={{
                  scale: activeAgent === collaborator.name ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-px h-8 bg-gray-200" />
                <div className={`w-20 h-20 rounded-2xl bg-gray-400 flex items-center justify-center mb-4 shadow-md relative`}>
                  {getIconForType(collaborator.type)}
                  {activeAgent === collaborator.name && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-indigo-400"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-center">{collaborator.name}</h3>
                <p className="text-sm text-gray-500 text-center mt-2 max-w-[220px] leading-relaxed">
                  {collaborator.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {renderTraceAnimation()}
      {renderActiveMessage()}
    </div>
  );
} 