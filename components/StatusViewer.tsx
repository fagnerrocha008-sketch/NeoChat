import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Contact } from '../types';

interface StatusViewerProps {
  contact: Contact;
  onClose: () => void;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({ contact, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-scale-in">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 p-2 z-20 flex gap-1">
        <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 px-4 z-20 flex justify-between items-center mt-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose}>
            <ChevronLeft className="text-white" size={28} />
          </button>
          <img src={contact.avatar} className="w-10 h-10 rounded-full border border-white/20" alt={contact.name} />
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm">{contact.name}</span>
            <span className="text-white/70 text-xs">hoje 10:35</span>
          </div>
        </div>
        <button onClick={onClose} className="bg-black/20 p-2 rounded-full backdrop-blur-md">
           <X className="text-white" size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center bg-dark-900 relative">
        <img 
          src={contact.statusImage || "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&q=80"} 
          alt="Status" 
          className="max-h-full max-w-full object-contain"
        />
        
        {/* Caption */}
        <div className="absolute bottom-20 left-0 right-0 text-center p-4 bg-gradient-to-t from-black/80 to-transparent pt-20">
           <p className="text-white text-lg font-medium">Bom dia galera! ☕🚀</p>
        </div>
      </div>

      {/* Reply Box */}
      <div className="p-3 bg-black flex flex-col items-center pb-8">
         <div className="flex flex-col items-center gap-2 mb-4">
             <div className="text-white/50 text-xs uppercase tracking-widest font-bold">Responder</div>
             <div className="w-0.5 h-4 bg-white/20"></div>
         </div>
         <input 
            type="text" 
            placeholder="Responder..." 
            className="w-full max-w-md bg-transparent border border-white/30 rounded-full px-6 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none text-center"
         />
      </div>
    </div>
  );
};