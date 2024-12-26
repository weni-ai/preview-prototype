import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { JsonViewer } from './JsonViewer';

interface BotResponseProps {
  message: string;
  type?: string;
  isActive?: boolean;
  fullTrace?: any;
}

export function BotResponse({ message, type, isActive, fullTrace }: BotResponseProps) {
  return (
    <div className={`
      bg-gradient-to-r from-indigo-50/50 to-purple-50/50 
      backdrop-blur-sm rounded-2xl p-4 mb-4 
      border border-indigo-100/50
      transition-all duration-300
      ${isActive ? 'shadow-xl scale-105' : 'shadow'}
    `}>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          {type && (
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-medium text-indigo-600">{type}</p>
              {isActive && <Sparkles className="w-3 h-3 text-purple-500" />}
            </div>
          )}
          <p className="text-sm text-gray-700">{message}</p>
          {fullTrace && <JsonViewer jsonContent={fullTrace} />}
        </div>
      </div>
    </div>
  );
} 