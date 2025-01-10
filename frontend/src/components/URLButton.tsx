import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface URLButtonProps {
  text: string;
  buttonText: string;
  url: string;
}

export function URLButton({ text, buttonText, url }: URLButtonProps) {
  return (
    <div className="space-y-4">
      <p className="text-base leading-relaxed whitespace-pre-wrap">{text}</p>
      <button
        onClick={() => window.open(url, '_blank')}
        className="w-full bg-white hover:bg-gray-50 text-[#00DED2] font-medium py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 transition-all hover:shadow-md"
      >
        {buttonText}
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
} 