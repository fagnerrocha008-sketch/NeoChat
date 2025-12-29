import React, { useState } from 'react';
import { Contact } from '../types';
import { Search, Plus, Sparkles, Settings, MessageSquarePlus, Filter } from 'lucide-react';

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
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const msgDate = new Date(date);
    if (now.toDateString() === msgDate.toDateString()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'unread') return matchesSearch && c.unreadCount > 0;
    if (filter === 'groups') return false; // Simulação: sem grupos no mock atual
    return matchesSearch;
  });

  const contactsWithStatus = contacts.filter(c => c.hasStatus);

  return (
    <div className="flex flex-col h-full bg-dark-950 border-r border-white/5 relative z-10">
      {/* Header */}
      <div className="p-4 flex flex-col gap-4 sticky top-0 bg-dark-950/80 backdrop-blur-md z-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white px-1">NeoChat</h2>
          <div className="flex gap-1">
             <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Plus size={22} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <MoreVerticalIcon size={22} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar ou começar uma nova conversa" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-800 text-sm text-white rounded-xl pl-11 pr-4 py-2.5 focus:outline-none transition-all placeholder:text-gray-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterTab active={filter === 'all'} label="Tudo" onClick={() => setFilter('all')} />
          <FilterTab active={filter === 'unread'} label="Não lidas" onClick={() => setFilter('unread')} />
          <FilterTab active={filter === 'groups'} label="Grupos" onClick={() => setFilter('groups')} />
        </div>
      </div>

      {/* Stories/Status */}
      <div className="px-4 pb-2 border-b border-white/5">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           {/* My Status */}
           <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div className="relative cursor-pointer">
              <img src={currentUserAvatar} className="w-14 h-14 rounded-full object-cover border border-white/10" />
              <div className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-0.5 border-2 border-dark-950">
                <Plus size={12} className="text-white" />
              </div>
            </div>
            <span className="text-[11px] text-gray-400">Meu status</span>
          </div>

          {contactsWithStatus.map((contact) => (
             <div 
               key={`story-${contact.id}`} 
               onClick={() => onViewStatus(contact)}
               className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer"
             >
              <div className="w-14 h-14 rounded-full p-[2px] border-2 border-primary-500">
                <img src={contact.avatar} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[11px] text-gray-300 truncate w-full text-center">{contact.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto pt-2">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 px-10 text-center">
            <p className="text-sm">Nenhuma conversa encontrada.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative group
                ${activeContactId === contact.id ? 'bg-white/5' : 'hover:bg-white/5'}
              `}
            >
              <div className="relative flex-shrink-0">
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-14 h-14 rounded-full object-cover bg-dark-800"
                />
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-primary-500 border-2 border-dark-950 rounded-full"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0 border-b border-white/5 pb-3 group-last:border-0 h-full flex flex-col justify-center mt-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-[16px] text-gray-100 truncate">
                    {contact.name}
                  </h3>
                  <span className={`text-xs ${contact.unreadCount > 0 ? 'text-primary-400 font-bold' : 'text-gray-500'}`}>
                    {formatTime(contact.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400 truncate pr-4">
                    {contact.isAI && activeContactId !== contact.id ? (
                      <span className="text-primary-400 flex items-center gap-1">✨ IA Assistente disponível</span>
                    ) : (
                      contact.lastMessage || "Inicie uma conversa..."
                    )}
                  </p>
                  {contact.unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-[11px] font-bold h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center rounded-full">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const FilterTab = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
      ${active ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-gray-400 hover:bg-dark-700'}
    `}
  >
    {label}
  </button>
);

const MoreVerticalIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);