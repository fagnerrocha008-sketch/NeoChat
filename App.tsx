import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { CallOverlay } from './components/CallOverlay';
import { StatusViewer } from './components/StatusViewer';
import { User, Contact, Message } from './types';
import { generateAIResponse } from './services/geminiService';

// Mock Data
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'ai-bot',
    name: 'Neo (AI Assistant)',
    email: 'neo@neochat.ai',
    avatar: 'https://cdn.dribbble.com/users/37530/screenshots/2937858/drib_blink_bot.gif',
    about: 'Sempre online e pronto para ajudar.',
    lastMessage: 'Como posso ajudar hoje?',
    lastMessageTime: new Date(),
    unreadCount: 1,
    isOnline: true,
    isAI: true,
    hasStatus: true,
    statusImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80'
  },
  {
    id: 'user-1',
    name: 'Alice Silva',
    email: 'alice.silva@email.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    about: 'Ocupada 👩‍💻',
    lastMessage: 'Combinado então!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unreadCount: 0,
    isOnline: false,
    isAI: false,
    hasStatus: true,
    statusImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'
  },
  {
    id: 'user-2',
    name: 'Bruno Tech',
    email: 'bruno.dev@tech.com',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    about: 'Na academia',
    lastMessage: 'Você viu a nova API?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
    unreadCount: 3,
    isOnline: true,
    isAI: false,
    hasStatus: false
  },
  {
    id: 'user-3',
    name: 'Carla Design',
    email: 'carla.ux@design.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    about: 'Apenas chamadas urgentes.',
    lastMessage: 'Vou enviar o layout.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 300),
    unreadCount: 0,
    isOnline: true,
    isAI: false,
    hasStatus: true,
    statusImage: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'
  }
];

// Helper for dynamic dates
const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

const INITIAL_MESSAGES: Record<string, Message[]> = {
  'ai-bot': [
    { id: '0', senderId: 'ai-bot', text: 'Iniciando sistema...', type: 'text', timestamp: getYesterday(), status: 'read' },
    { id: '1', senderId: 'ai-bot', text: 'Olá! Sou o Neo. Bem-vindo ao futuro.', type: 'text', timestamp: new Date(), status: 'read' }
  ],
  'user-1': [
    { id: '0', senderId: 'user-1', text: 'Oi Alice, preciso daquelas fotos.', type: 'text', timestamp: getYesterday(), status: 'read' },
    { id: '1', senderId: 'user-1', text: 'Oi, tudo bem?', type: 'text', timestamp: new Date(Date.now() - 100000), status: 'read' },
    { id: '2', senderId: 'me', text: 'Tudo ótimo e com você?', type: 'text', timestamp: new Date(Date.now() - 90000), status: 'read' },
    { id: '3', senderId: 'user-1', text: 'Combinado então!', type: 'text', timestamp: new Date(Date.now() - 80000), status: 'read' }
  ],
  'user-2': [
    { id: '1', senderId: 'user-2', text: 'Você viu a nova API?', type: 'text', timestamp: new Date(), status: 'delivered' }
  ]
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [callStatus, setCallStatus] = useState<{ active: boolean, type: 'voice' | 'video' }>({ active: false, type: 'voice' });
  const [viewingStatus, setViewingStatus] = useState<Contact | null>(null);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const currentMessages = activeContactId ? (messages[activeContactId] || []) : [];

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleSendMessage = (
      text: string, 
      type: 'text' | 'audio' | 'image' = 'text', 
      mediaUrl?: string, 
      senderId: string = 'me',
      replyTo?: Message
    ) => {
    if (!activeContactId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: senderId,
      text,
      type,
      mediaUrl,
      timestamp: new Date(),
      status: senderId === 'me' ? 'sent' : 'read',
      replyTo: replyTo ? {
        id: replyTo.id,
        text: replyTo.text,
        type: replyTo.type,
        senderName: replyTo.senderId === 'me' ? 'Você' : (activeContact?.name || 'Desconhecido')
      } : undefined
    };

    // Update messages
    setMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMessage]
    }));

    // Update contact preview
    setContacts(prev => prev.map(c => {
      if (c.id === activeContactId) {
        let previewText = text;
        if (type === 'audio') previewText = '🎵 Áudio';
        if (type === 'image') previewText = '📷 Imagem';
        return { ...c, lastMessage: previewText, lastMessageTime: new Date() };
      }
      return c;
    }));
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeContactId) return;
    setMessages(prev => ({
      ...prev,
      [activeContactId]: prev[activeContactId].filter(m => m.id !== messageId)
    }));
  };

  const handleDeleteChat = () => {
    if (!activeContactId) return;
    setMessages(prev => ({
      ...prev,
      [activeContactId]: []
    }));
    // Optional: Reset last message in contact list
    setContacts(prev => prev.map(c => {
      if (c.id === activeContactId) {
        return { ...c, lastMessage: undefined };
      }
      return c;
    }));
  };

  const startCall = (type: 'voice' | 'video') => {
    setCallStatus({ active: true, type });
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex bg-black text-white overflow-hidden font-sans relative">
      
      {/* Call Overlay */}
      {callStatus.active && activeContact && (
        <CallOverlay 
          contact={activeContact} 
          type={callStatus.type} 
          onEndCall={() => setCallStatus({ ...callStatus, active: false })} 
        />
      )}

      {/* Status Viewer */}
      {viewingStatus && (
        <StatusViewer 
          contact={viewingStatus}
          onClose={() => setViewingStatus(null)}
        />
      )}

      {/* Sidebar List */}
      <div className={`
        flex-shrink-0 w-full md:w-[380px] h-full transition-transform duration-300 absolute md:relative z-10
        ${activeContactId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        <ChatList 
          contacts={contacts} 
          activeContactId={activeContactId || undefined} 
          onSelectContact={(c) => {
            setActiveContactId(c.id);
            // Mark as read
            setContacts(prev => prev.map(contact => contact.id === c.id ? {...contact, unreadCount: 0} : contact));
          }}
          currentUserAvatar={user.avatar}
          onViewStatus={(c) => setViewingStatus(c)}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 h-full w-full absolute md:relative transition-transform duration-300 bg-dark-950
        ${activeContactId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {activeContactId && activeContact ? (
          <ChatWindow 
            contact={activeContact} 
            messages={currentMessages} 
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onDeleteChat={handleDeleteChat}
            onBack={() => setActiveContactId(null)}
            onCall={startCall}
          />
        ) : (
          <div className="hidden md:flex h-full flex-col items-center justify-center text-gray-500 bg-[#0c0c0e] relative overflow-hidden border-l border-dark-800">
             {/* Decorative Background */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[100px]" />
             
             <div className="relative z-10 flex flex-col items-center">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/man-chatting-online-illustration-download-in-svg-png-gif-file-formats--chat-logo-app-bubble-smartphone-pack-people-illustrations-4364402.png" alt="Empty" className="w-64 opacity-50 grayscale hover:grayscale-0 transition-all duration-700" />
                <h2 className="text-3xl font-light mt-8 text-white">NeoChat Web</h2>
                <p className="mt-4 text-center max-w-sm text-gray-400">
                  Envie e receba mensagens, faça chamadas e compartilhe momentos com criptografia de ponta a ponta.
                </p>
                <div className="mt-10 flex items-center gap-2 text-sm text-gray-500">
                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                   Online e sincronizado
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;