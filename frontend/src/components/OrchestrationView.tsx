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
  const [activeTab, setActiveTab] = useState<'visual' | 'logs'>('visual');

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

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex border-b mb-4">
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
        <div className="flex-1">
          {loading && <div>Loading...</div>}
          {error && <div>Error: {error}</div>}
          {!loading && !error && (
            <div className="flex flex-col items-center space-y-8">
              {renderTraceAnimation()}
              {renderActiveMessage()}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 bg-gray-50 rounded">
          <pre className="whitespace-pre-wrap">
            {traces.map((trace, index) => (
              <div key={index} className="mb-4 p-2 bg-white rounded shadow">
                <code>{JSON.stringify(trace, null, 2)}</code>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
} 