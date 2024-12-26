import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface JsonViewerProps {
  jsonContent: any;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ jsonContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonContent, null, 2));
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        <button onClick={handleCopy} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Copy JSON">
          <Copy className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-64">
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(jsonContent, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}; 