import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AgentIconProps {
  config: {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
  };
  isActive: boolean;
}

export function AgentIcon({ config, isActive }: AgentIconProps) {
  const Icon = config.icon;
  
  return (
    <div className="relative">
      {/* Glowing effect for active state */}
      {isActive && (
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-20
                animate-ping`}
              style={{
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Icon container */}
      <div className={`relative z-10 p-4 rounded-xl bg-gradient-to-br ${config.gradient}
        transform transition-all duration-300 ${isActive ? 'scale-110 animate-glow' : 'scale-100'}
        shadow-lg ${isActive ? 'shadow-current/30' : 'shadow-current/10'}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
} 