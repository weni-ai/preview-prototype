import { Brain, Shield, LineChart, MessageSquare } from 'lucide-react';

export const agentConfig = {
  manager: {
    icon: Brain,
    gradient: 'from-[#00DED2] to-[#00DED2]/80',
    ringGradient: 'from-[#00DED2]/20 to-[#00DED2]/10',
    glowColor: '[#00DED2]',
    title: 'Manager',
    description: 'Coordinating',
    thinkingMessage: 'Analyzing request and coordinating team...'
  },
  analyst: {
    icon: LineChart,
    gradient: 'from-[#00DED2] to-[#00DED2]/80',
    ringGradient: 'from-[#00DED2]/20 to-[#00DED2]/10',
    glowColor: '[#00DED2]',
    title: 'Analyst',
    description: 'Processing',
    thinkingMessage: 'Analyzing context and processing request...'
  },
  security: {
    icon: Shield,
    gradient: 'from-[#00DED2] to-[#00DED2]/80',
    ringGradient: 'from-[#00DED2]/20 to-[#00DED2]/10',
    glowColor: '[#00DED2]',
    title: 'Security',
    description: 'Verifying',
    thinkingMessage: 'Verifying security requirements...'
  },
  orders: {
    icon: MessageSquare,
    gradient: 'from-[#00DED2] to-[#00DED2]/80',
    ringGradient: 'from-[#00DED2]/20 to-[#00DED2]/10',
    glowColor: '[#00DED2]',
    title: 'Orders',
    description: 'Managing',
    thinkingMessage: 'Processing order information...'
  }
} as const; 