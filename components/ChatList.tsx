import React from 'react';
import { Contact } from '../types';
import { Search, Plus, Sparkles, Settings, MessageSquarePlus } from 'lucide-react';

interface ChatListProps {
  contacts: Contact[];
  activeContactId?: string;
  onSelectContact: (contact: Contact) => void;
  currentUserAvatar?: string;
  onViewStatus: (contact: Contact) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ 
  contacts, 
  activeContactId, 
  onSelectContact,
  currentUserAvatar,
  onViewStatus
}) => {
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const contactsWithStatus = contacts.filter(c => c.hasStatus);

  return (
    <div className="flex flex-col h-full bg-dark-950/50 backdrop-blur-sm border-r border-white/5 relative z-10">
      {/* Header */}
      <div className="p-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src={currentUserAvatar || "https://picsum.photos/40"} 
              alt="My Profile" 
              className="w-10 h-10 rounded-full border border-white/10 object-cover relative z-10"
            />
             <div className="absolute -bottom-1 -right-1 bg-dark-950 rounded-full p-0.5 z-20">
               <div className="w-2.5 h-2.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
             </div>
          </div>
          <h2 className="font-bold text-xl tracking-tight text-white">NeoChat</h2>
        </div>
        <div className="flex gap-2">
           <button className="w-10 h-10 flex items-center justify-center rounded-full glass-light text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
            <MessageSquarePlus size={18} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full glass-light text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Stories / Status Bar */}
      <div className="px-5 pb-4">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           {/* My Status */}
           <div className="flex flex-col items-center gap-2 min-w-[68px]">
            <div className="w-[68px] h-[68px] rounded-2xl border border-dashed border-gray-600 flex items-center justify-center p-1 cursor-pointer hover:border-primary-500 transition-colors group relative bg-dark-900/40">
              <img 
                src={currentUserAvatar} 
                className="w-full h-full rounded-xl object-cover opacity-50 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-dark-900/80 p-1.5 rounded-lg backdrop-blur-sm">
                   <Plus size={20} className="text-primary-500" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-gray-400">Novo</span>
          </div>

          {/* Other Statuses */}
          {contactsWithStatus.map((contact, idx) => (
             <div 
               key={`story-${contact.id}`} 
               onClick={() => onViewStatus(contact)}
               className="flex flex-col items-center gap-2 min-w-[68px] cursor-pointer group animate-fade-in"
               style={{ animationDelay: `${idx * 100}ms` }}
             >
             <div className="w-[68px] h-[68px] rounded-2xl p-[2px] bg-gradient-to-tr from-primary-500 via-blue-500 to-purple-500 shadow-lg shadow-primary-900/20 group-hover:shadow-primary-500/20 transition-all duration-300">
               <div className="bg-dark-950 p-[2px] rounded-[14px] w-full h-full">
                 <img 
                   src={contact.avatar} 
                   className="w-full h-full rounded-xl object-cover group-hover:scale-105 transition-transform duration-500" 
                   alt={contact.name} 
                 />
               </div>
             </div>
             <span className="text-[11px] font-medium text-gray-300 truncate w-16 text-center">{contact.name.split(' ')[0]}</span>
           </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="w-full glass-light text-sm text-white rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:bg-white/5 transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {contacts.map((contact) => (
          <div 
            key={contact.id}
            onClick={() => onSelectContact(contact)}
            className={`p-3 rounded-2xl cursor-pointer transition-all duration-300 relative group
              ${activeContactId === contact.id ? 'bg-white/10 backdrop-blur-md shadow-lg' : 'hover:bg-white/5'}
            `}
          >
            <div className="flex gap-4 items-center">
              <div className="relative">
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className={`w-12 h-12 rounded-full object-cover bg-dark-800 transition-all duration-300 ${activeContactId === contact.id ? 'rounded-xl' : ''}`}
                />
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 border-2 border-dark-950 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                )}
                {contact.isAI && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white border border-dark-900 flex items-center gap-0.5 shadow-lg">
                    <Sparkles size={8} /> AI
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`font-semibold truncate text-[15px] ${activeContactId === contact.id ? 'text-white' : 'text-gray-200 group-hover:text-white transition-colors'}`}>
                    {contact.name}
                  </h3>
                  <span className={`text-[11px] font-medium ${contact.unreadCount > 0 ? 'text-primary-400' : 'text-gray-500'}`}>
                    {formatTime(contact.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400 truncate pr-2 flex-1 group-hover:text-gray-300 transition-colors">
                    {contact.isAI && activeContactId !== contact.id ? (
                      <span className="text-blue-400 flex items-center gap-1"><Sparkles size={10} /> Pergunte ao Neo...</span>
                    ) : (
                      contact.lastMessage || <span className="italic opacity-30">Iniciar conversa</span>
                    )}
                  </p>
                  {contact.unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};