import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2 } from 'lucide-react';
import { Contact } from '../types';

interface CallOverlayProps {
  contact: Contact;
  type: 'voice' | 'video';
  onEndCall: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ contact, type: initialType, onEndCall }) => {
  const [callStatus, setCallStatus] = useState('Chamando...');
  const [duration, setDuration] = useState(0);
  
  // Hardware controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(initialType === 'video');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Connection timer simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('Conectado');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'Conectado') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Hardware Access
  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: true // Always ask for video capability to allow toggling, but we might disable track initially
        });
        
        setLocalStream(stream);
        
        // Initial state configuration based on props
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) videoTrack.enabled = initialType === 'video';
        if (audioTrack) audioTrack.enabled = true;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setCallStatus("Erro de acesso à câmera/mic");
      }
    };

    startStream();

    return () => {
      // Cleanup tracks on unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  // Sync state with hardware tracks
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];

      if (videoTrack) videoTrack.enabled = isCameraOn;
      if (audioTrack) audioTrack.enabled = !isMuted;
    }
  }, [isCameraOn, isMuted, localStream]);

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    setIsMuted(!isMuted);
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-950 flex flex-col items-center justify-between animate-fade-in overflow-hidden">
      
      {/* BACKGROUND (Remote User Simulation) */}
      <div className="absolute inset-0 z-0">
         {/* If it were a real P2P call, the remote video would be here. 
             Since it's a mock, we show a blurred version of their avatar or a solid color 
         */}
         <div className="w-full h-full relative">
            <img 
              src={contact.avatar} 
              className="w-full h-full object-cover opacity-30 blur-3xl scale-110" 
              alt="Background"
            />
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Main Center Display (Remote User) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
              <div className="relative mb-6">
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-dark-800 shadow-2xl animate-pulse"
                />
                 <span className={`absolute bottom-2 right-2 p-3 rounded-full border border-dark-900 ${callStatus === 'Conectado' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {initialType === 'video' ? <Video size={20} className="text-white" /> : <Phone size={20} className="text-white" />}
                 </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{contact.name}</h2>
              <p className="text-gray-200 font-medium tracking-wide text-lg bg-dark-900/50 px-4 py-1 rounded-full backdrop-blur-md">
                {status === 'Conectado' ? formatTime(duration) : callStatus}
              </p>
            </div>
         </div>
      </div>

      {/* LOCAL USER VIDEO (Floating PIP) */}
      <div className={`
        absolute top-4 right-4 z-20 w-32 h-48 md:w-48 md:h-72 bg-black rounded-2xl overflow-hidden border border-dark-700 shadow-2xl transition-all duration-300
        ${!isCameraOn ? 'hidden' : 'block'}
      `}>
        <video 
          ref={localVideoRef}
          autoPlay 
          muted 
          playsInline
          className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
        />
        <div className="absolute bottom-2 left-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* If Camera is OFF, show a "Camera Off" indicator in the PIP area or just hide it. 
          Here we hide it to look like standard apps, or we could show an icon.
      */}

      {/* CONTROLS */}
      <div className="relative z-30 w-full pb-10 pt-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <div className="flex items-center justify-center gap-6 md:gap-10">
          
          {/* Mute Toggle */}
          <button 
            onClick={toggleMic}
            className={`p-4 md:p-5 rounded-full transition-all duration-200 ${isMuted ? 'bg-white text-dark-900' : 'bg-dark-800/80 backdrop-blur-md text-white hover:bg-dark-700'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          {/* End Call */}
          <button 
            onClick={handleEndCall}
            className="p-6 md:p-7 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all shadow-xl shadow-red-900/50 scale-100 hover:scale-110 active:scale-95"
          >
            <PhoneOff size={32} fill="currentColor" />
          </button>
          
          {/* Camera Toggle */}
          <button 
            onClick={toggleCamera}
            className={`p-4 md:p-5 rounded-full transition-all duration-200 ${!isCameraOn ? 'bg-white text-dark-900' : 'bg-dark-800/80 backdrop-blur-md text-white hover:bg-dark-700'}`}
          >
            {!isCameraOn ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

        </div>
        
        <div className="text-center mt-6 text-gray-400 text-xs font-medium uppercase tracking-widest">
           Criptografado de ponta a ponta
        </div>
      </div>
    </div>
  );
};