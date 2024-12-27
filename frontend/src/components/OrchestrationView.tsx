import React, { useEffect, useState } from 'react';
import { Brain, HelpCircle, Shield, ShoppingBag } from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
}

interface Manager {
  name: string;
  description: string;
  type: string;
}

interface OrchestrationViewProps {
  traces: any[];
}

export function OrchestrationView({ traces }: OrchestrationViewProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/collaborators');
        if (!response.ok) {
          throw new Error('Failed to fetch collaborators');
        }
        const data = await response.json();
        setCollaborators(data.collaborators);
        setManager(data.manager);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, []);

  const getIconForType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MANAGER':
        return <Brain className="w-8 h-8 text-white" />;
      case 'SECURITY':
        return <Shield className="w-8 h-8 text-white" />;
      case 'ANALYST':
        return <HelpCircle className="w-8 h-8 text-white" />;
      case 'ORDERS':
        return <ShoppingBag className="w-8 h-8 text-white" />;
      default:
        return <HelpCircle className="w-8 h-8 text-white" />;
    }
  };

  const getBackgroundColorForType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MANAGER':
        return 'bg-purple-500';
      case 'SECURITY':
        return 'bg-red-400';
      case 'ANALYST':
        return 'bg-blue-400';
      case 'ORDERS':
        return 'bg-emerald-400';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col items-center h-full pt-8">
      {manager && (
        <div className="mb-20 relative">
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-2xl ${getBackgroundColorForType(manager.type)} flex items-center justify-center mb-4 shadow-lg`}>
              {getIconForType(manager.type)}
            </div>
            <h3 className="text-2xl font-semibold">{manager.name}</h3>
            <p className="text-base text-gray-500 mt-2">{manager.description}</p>
          </div>
          {collaborators.length > 0 && (
            <div className="absolute w-px h-20 bg-gray-200 left-1/2 -bottom-20 transform -translate-x-1/2"></div>
          )}
        </div>
      )}

      {collaborators.length > 0 && (
        <div className="w-full px-4">
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-full h-px">
              <div className="w-[80%] h-px bg-gray-200 mx-auto"></div>
            </div>
            {collaborators.map((collaborator, index) => (
              <div key={collaborator.id} className="flex flex-col items-center relative">
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-px h-8 bg-gray-200"></div>
                <div className={`w-20 h-20 rounded-2xl ${getBackgroundColorForType(collaborator.type)} flex items-center justify-center mb-4 shadow-md`}>
                  {getIconForType(collaborator.type)}
                </div>
                <h3 className="text-lg font-semibold text-center">{collaborator.name}</h3>
                <p className="text-sm text-gray-500 text-center mt-2 max-w-[220px] leading-relaxed">{collaborator.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 