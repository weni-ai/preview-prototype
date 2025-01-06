import React, { useState, useRef } from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';

// Get the backend URL from runtime configs, environment variables, or fallback
const BACKEND_URL = (window as any).configs?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

interface AudioRecorderProps {
  onAudioRecorded: (text: string) => void;
  isLoading: boolean;
}

export function AudioRecorder({ onAudioRecorded, isLoading }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      // Wait for the last chunk
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
            sendAudioForTranscription(audioBlob);
            resolve();
          };
        }
      });

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.status === 'success' && data.text) {
        onAudioRecorded(data.text);
      } else {
        console.error('Transcription failed:', data.error);
      }
    } catch (error) {
      console.error('Error sending audio for transcription:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isLoading}
          className={`p-2 rounded-full transition-all ${
            isLoading
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-[#00DED2] hover:bg-[#00DED2]/80'
          }`}
        >
          <Mic className="w-5 h-5 text-white" />
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-[#00DED2]/10 px-3 py-2 rounded-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-gray-600">{formatDuration(recordingDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-all"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={stopRecording}
              className="p-1.5 rounded-full bg-[#00DED2] hover:bg-[#00DED2]/80 transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 