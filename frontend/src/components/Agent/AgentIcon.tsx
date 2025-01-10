import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentIconProps {
  config: {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
  };
  isActive: boolean;
  status: 'active' | 'waiting' | 'completed';
}

export function AgentIcon({ config, isActive, status }: AgentIconProps) {
  const Icon = config.icon;
  
  const getStatusGradient = () => {
    switch (status) {
      case 'active':
        return 'from-[#00DED2] to-[#00DED2]/80';
      case 'completed':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* Glowing effect for active state */}
      {isActive && (
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${getStatusGradient()} opacity-20`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.1, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
      
      {/* Icon container */}
      <motion.div 
        className={`relative z-10 p-4 rounded-xl bg-gradient-to-br ${getStatusGradient()}
          transform transition-all duration-300
          shadow-lg ${isActive ? 'shadow-[#00DED2]/30' : 'shadow-current/10'}`}
        animate={{ 
          scale: isActive ? 1.1 : 1,
          transition: {
            duration: 0.3,
            ease: "easeInOut"
          }
        }}
      >
        <Icon className="w-6 h-6 text-white" />
        
        {/* Circular motion effect for active state */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-white/20"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </motion.div>

      {/* Progress indicator for active state */}
      {isActive && (
        <motion.div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#00DED2]"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
} 