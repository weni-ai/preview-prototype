import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

interface ImageUploaderProps {
  onImageAnalyzed: (text: string, imageUrl: string) => void;
  onImageSelected: (file: File | null) => void;
  isLoading: boolean;
  isSending?: boolean;
  shouldClear: boolean;
}

export function ImageUploader({ onImageAnalyzed, onImageSelected, isLoading, isSending = false, shouldClear }: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldClear) {
      clearSelectedImage();
    }
  }, [shouldClear]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      onImageSelected(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelected(null);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        ref={fileInputRef}
        disabled={isLoading || isSending}
      />
      {!selectedImage ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isSending}
          className={`p-2 rounded-full transition-all ${
            isLoading || isSending
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-[#00DED2] hover:bg-[#00DED2]/80'
          }`}
        >
          <ImageIcon className="w-5 h-5 text-white" />
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-[#00DED2]/10 p-2 rounded-xl">
          <div className="relative">
            <img
              src={previewUrl || ''}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              onClick={clearSelectedImage}
              disabled={isLoading || isSending}
              className={`absolute -top-2 -right-2 p-1 rounded-full bg-white shadow-md ${
                isLoading || isSending
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 