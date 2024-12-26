import React from 'react';

interface CollaborationLinesProps {
  activeAgent: number;
}

export function CollaborationLines({ activeAgent }: CollaborationLinesProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g className="stroke-[3]" filter="url(#glow)">
        {/* Lines connecting agents */}
        <line
          x1="50%" y1="25%" x2="16.67%" y2="75%"
          className={`transition-all duration-700 ${activeAgent >= 1 ? 'opacity-100' : 'opacity-20'}`}
          stroke="url(#line-gradient)"
          strokeDasharray={activeAgent >= 1 ? "0" : "5,5"}
        />
        <line
          x1="50%" y1="25%" x2="50%" y2="75%"
          className={`transition-all duration-700 ${activeAgent >= 2 ? 'opacity-100' : 'opacity-20'}`}
          stroke="url(#line-gradient)"
          strokeDasharray={activeAgent >= 2 ? "0" : "5,5"}
        />
        <line
          x1="50%" y1="25%" x2="83.33%" y2="75%"
          className={`transition-all duration-700 ${activeAgent >= 3 ? 'opacity-100' : 'opacity-20'}`}
          stroke="url(#line-gradient)"
          strokeDasharray={activeAgent >= 3 ? "0" : "5,5"}
        />
      </g>
    </svg>
  );
} 