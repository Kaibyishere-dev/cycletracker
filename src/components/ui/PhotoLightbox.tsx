'use client';
import React from 'react';
import { X, Download } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

interface PhotoLightboxProps {
  open: boolean;
  photoUrl: string;
  photoName: string;
  onClose: () => void;
}

export default function PhotoLightbox({ open, photoUrl, photoName, onClose }: PhotoLightboxProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 flex flex-col items-center gap-3 scale-enter max-w-3xl w-full">
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-sm font-medium truncate">{photoName}</span>
          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              download={photoName}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Download foto"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="w-full rounded-xl overflow-hidden bg-black/30">
          <AppImage
            src={photoUrl}
            alt={`Foto scan berkas: ${photoName}`}
            width={900}
            height={600}
            className="w-full object-contain max-h-[75vh]"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}