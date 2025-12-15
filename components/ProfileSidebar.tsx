import React from 'react';
import { Contact } from '../types';
import { X, Phone, Video, Bell, Star, Ban, Trash2, Mail } from 'lucide-react';

interface ProfileSidebarProps {
  contact: Contact;
  onClose: () => void;
  onDeleteChat: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ contact, onClose, onDeleteChat }) => {
  return (
    <div className="w-full h-full bg-dark-900 border-l border-dark-800 flex flex-col animate-slide-in-right overflow-y-auto">
      <div className="p-4 flex items-center gap-3 border-b border-dark-800 sticky top-0 bg-dark-900/95 backdrop-blur z-10">
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <h2 className="font-semibold text-lg">Dados do contato</h2>
      </div>

      <div className="flex flex-col items-center p-8 border-b border-dark-800 bg-dark-800/20">
        <img 
          src={contact.avatar} 
          alt={contact.name} 
          className="w-40 h-40 rounded-full object-cover mb-4 shadow-xl border-4 border-dark-800"
        />
        <h2 className="text-2xl font-bold text-white mb-1">{contact.name}</h2>
        <p className="text-gray-400 flex items-center gap-2">
          <Mail size={14} />
          {contact.email}
        </p>
        
        <div className="flex gap-6 mt-6 w-full justify-center">
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center text-primary-500 group-hover:bg-dark-700 transition-colors">
              <Phone size={24} />
            </div>
            <span className="text-xs text-gray-400">Áudio</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center text-primary-500 group-hover:bg-dark-700 transition-colors">
              <Video size={24} />
            </div>
            <span className="text-xs text-gray-400">Vídeo</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center text-gray-400 group-hover:bg-dark-700 transition-colors">
              <Search size={24} />
            </div>
            <span className="text-xs text-gray-400">Buscar</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <div className="bg-dark-800/50 p-4 rounded-xl mb-4">
          <h3 className="text-sm text-gray-500 mb-1">Recado</h3>
          <p className="text-gray-200">{contact.about || "Disponível"}</p>
        </div>

        <div className="bg-dark-800/50 rounded-xl overflow-hidden">
           <button className="w-full p-4 flex items-center justify-between hover:bg-dark-800 transition-colors text-left">
             <div className="flex items-center gap-3 text-gray-200">
               <Bell size={20} className="text-gray-500" />
               <span>Silenciar notificações</span>
             </div>
           </button>
           <div className="h-[1px] bg-dark-800 mx-4"></div>
           <button className="w-full p-4 flex items-center justify-between hover:bg-dark-800 transition-colors text-left">
             <div className="flex items-center gap-3 text-gray-200">
               <Star size={20} className="text-gray-500" />
               <span>Mensagens favoritas</span>
             </div>
           </button>
        </div>

        <div className="pt-4 space-y-3">
          <button className="w-full p-4 flex items-center gap-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <Ban size={20} />
            Bloquear {contact.name}
          </button>
          <button 
            onClick={onDeleteChat}
            className="w-full p-4 flex items-center gap-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
            Apagar conversa
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple internal icon for this file since Search wasn't imported
const Search = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);