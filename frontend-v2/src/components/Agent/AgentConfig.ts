import { Brain, Shield, HelpCircle, ShoppingBag } from 'lucide-react';

export const agentConfig = {
  manager: {
    icon: Brain,
    gradient: 'from-purple-500 to-indigo-500',
    ringGradient: 'from-purple-200 to-indigo-200',
    glowColor: 'purple',
    title: 'Manager',
    description: 'Coordinating the team',
    thinkingMessage: 'Analyzing request complexity and distributing tasks...'
  },
  analyst: {
    icon: HelpCircle,
    gradient: 'from-blue-500 to-cyan-500',
    ringGradient: 'from-blue-200 to-cyan-200',
    glowColor: 'blue',
    title: 'Question Analyst',
    description: 'Analyzing your query',
    thinkingMessage: 'Processing context and identifying key points...'
  },
  security: {
    icon: Shield,
    gradient: 'from-red-500 to-pink-500',
    ringGradient: 'from-red-200 to-pink-200',
    glowColor: 'red',
    title: 'Security Analyst',
    description: 'Verifying security',
    thinkingMessage: 'Checking security patterns and validating request...'
  },
  orders: {
    icon: ShoppingBag,
    gradient: 'from-emerald-500 to-teal-500',
    ringGradient: 'from-emerald-200 to-teal-200',
    glowColor: 'emerald',
    title: 'Orders Analyst',
    description: 'Processing orders',
    thinkingMessage: 'Organizing information and preparing detailed response...'
  }
} as const; 