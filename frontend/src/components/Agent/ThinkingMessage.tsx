import React from 'react';

interface ThinkingMessageProps {
  message: string;
  isVisible: boolean;
}

export function ThinkingMessage({ message, isVisible }: ThinkingMessageProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute -right-4 top-0 transform translate-x-full ml-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-indigo-50 min-w-[200px]">
        <p className="text-sm text-gray-600">{message}</p>
        <div className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2">
          <div className="w-2 h-2 bg-white rotate-45 border-l border-b border-indigo-50" />
        </div>
      </div>
    </div>
  );
} 