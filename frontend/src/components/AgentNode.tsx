import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, CheckCircle2, ChevronDown, ChevronUp, Copy } from 'lucide-react';

interface AgentNodeProps {
  type: string;
  status: 'active' | 'completed' | 'waiting';
  summary: string;
  details: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

export function AgentNode({ type, status, summary, details, isExpanded, onToggle, onCopy }: AgentNodeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'active' ? (
            <Activity className="w-5 h-5 text-blue-500" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Brain className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">{type}</h3>
            <p className="text-sm text-gray-500">{summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Copy details"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 border-t pt-4"
        >
          <div className="space-y-3">
            {details.modelInvocationOutput?.rationale?.text && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Rationale</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {details.modelInvocationOutput.rationale.text}
                </p>
              </div>
            )}
            {details.modelInvocationOutput?.observation?.finalResponse?.text && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Response</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {details.modelInvocationOutput.observation.finalResponse.text}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Full Details</h4>
              <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-96">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}