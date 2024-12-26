import React from 'react';

interface AgentInfoProps {
  title: string;
  description: string;
}

export function AgentInfo({ title, description }: AgentInfoProps) {
  return (
    <div className="text-center">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
} 