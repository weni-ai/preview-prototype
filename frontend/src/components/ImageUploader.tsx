import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

interface ImageUploaderProps {
  onImageAnalyzed: (text: string, imageUrl: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageAnalyzed, isLoading }: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendImageForAnalysis = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.status === 'success' && data.text) {
        onImageAnalyzed(data.text, `${BACKEND_URL}${data.imageUrl}`);
        clearSelectedImage();
      } else {
        console.error('Image analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Error sending image for analysis:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        ref={fileInputRef}
      />
      {!selectedImage ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`p-2 rounded-full transition-all ${
            isLoading
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
              className="absolute -top-2 -right-2 p-1 rounded-full bg-white shadow-md hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={sendImageForAnalysis}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-all ${
              isLoading
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-[#00DED2] hover:bg-[#00DED2]/80 text-white'
            }`}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      )}
    </div>
  );
} 