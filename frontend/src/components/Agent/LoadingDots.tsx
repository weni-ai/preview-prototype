import React from 'react';

export function LoadingDots() {
  return (
    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  );
} 