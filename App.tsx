import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { CallOverlay } from './components/CallOverlay';
import { StatusViewer } from './components/StatusViewer';
import { User, Contact, Message } from './types';

// Mock Data mais robusto para simular histórico
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'ai-bot',
    name: 'Neo Assistente (IA)',
    email: 'neo@neochat.ai',
    avatar: 'https://cdn.dribbble.com/users/37530/screenshots/2937858/drib_blink_bot.gif',
    about: 'Sempre pronto para uma conversa inteligente.',
    lastMessage: 'Olá! Como posso te ajudar hoje?',
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
    about: 'No trabalho 👩‍💻',
    lastMessage: 'Combinado então! Até mais.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
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
    about: 'Codando algo novo...',
    lastMessage: 'Mandei o repositório no seu email.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
    unreadCount: 2,
    isOnline: true,
    isAI: false,
    hasStatus: false
  }
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  'ai-bot': [
    { id: '1', senderId: 'ai-bot', text: 'Olá! Sou o Neo. Como posso ser útil?', type: 'text', timestamp: new Date(Date.now() - 5000), status: 'read' }
  ],
  'user-1': [
    { id: 'm1', senderId: 'user-1', text: 'Oi, você tem os relatórios?', type: 'text', timestamp: new Date(Date.now() - 3600000), status: 'read' },
    { id: 'm2', senderId: 'me', text: 'Tenho sim, vou te mandar.', type: 'text', timestamp: new Date(Date.now() - 3500000), status: 'read' },
    { id: 'm3', senderId: 'user-1', text: 'Combinado então! Até mais.', type: 'text', timestamp: new Date(Date.now() - 1800000), status: 'read' }
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

  const handleSendMessage = (text: string, type: 'text' | 'audio' | 'image' = 'text', mediaUrl?: string, senderId: string = 'me', replyTo?: Message) => {
    if (!activeContactId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId,
      text,
      type,
      mediaUrl,
      timestamp: new Date(),
      status: senderId === 'me' ? 'delivered' : 'read',
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, type: replyTo.type, senderName: replyTo.senderId === 'me' ? 'Você' : activeContact?.name || '' } : undefined
    };

    setMessages(prev => ({ ...prev, [activeContactId]: [...(prev[activeContactId] || []), newMessage] }));
    setContacts(prev => prev.map(c => c.id === activeContactId ? { ...c, lastMessage: type === 'text' ? text : `[${type}]`, lastMessageTime: new Date() } : c));
  };

  const handleBack = () => setActiveContactId(null);

  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <div className="h-screen w-screen flex bg-[#111b21] text-[#e9edef] overflow-hidden font-sans">
      {/* Sidebar - Lista de Conversas */}
      <div className={`flex-shrink-0 w-full md:w-[420px] lg:w-[450px] h-full border-r border-white/5 transition-all ${activeContactId ? 'hidden md:block' : 'block'}`}>
        <ChatList 
          contacts={contacts} 
          activeContactId={activeContactId || undefined}
          onSelectContact={(c) => {
            setActiveContactId(c.id);
            setContacts(prev => prev.map(contact => contact.id === c.id ? { ...contact, unreadCount: 0 } : contact));
          }}
          currentUserAvatar={user.avatar}
          onViewStatus={setViewingStatus}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 h-full relative ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
        {activeContactId && activeContact ? (
          <ChatWindow 
            contact={activeContact} 
            messages={currentMessages} 
            onSendMessage={handleSendMessage}
            onDeleteMessage={(id) => setMessages(p => ({ ...p, [activeContactId]: p[activeContactId].filter(m => m.id !== id) }))}
            onDeleteChat={() => setMessages(p => ({ ...p, [activeContactId]: [] }))}
            onBack={handleBack}
            onCall={(type) => setCallStatus({ active: true, type })}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] relative">
            <div className="flex flex-col items-center text-center px-10">
               <div className="w-64 h-64 opacity-20 mb-8 grayscale invert">
                  <img src="https://cdni.iconscout.com/illustration/premium/thumb/man-chatting-online-illustration-download-in-svg-png-gif-file-formats--chat-logo-app-bubble-smartphone-pack-people-illustrations-4364402.png" alt="NeoChat" className="w-full h-full object-contain" />
               </div>
               <h2 className="text-3xl font-light text-gray-100 mb-4">NeoChat Web</h2>
               <p className="text-gray-400 max-w-md leading-relaxed">
                  Envie e receba mensagens sem precisar manter seu celular conectado. Use o NeoChat em até 4 dispositivos ao mesmo tempo.
               </p>
               <div className="mt-12 flex items-center gap-2 text-gray-500 text-sm">
                  <LockIcon size={14} />
                  Criptografado de ponta a ponta
               </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary-500/50"></div>
          </div>
        )}
      </div>

      {/* Overlays */}
      {callStatus.active && activeContact && (
        <CallOverlay contact={activeContact} type={callStatus.type} onEndCall={() => setCallStatus({ active: false, type: 'voice' })} />
      )}
      {viewingStatus && (
        <StatusViewer contact={viewingStatus} onClose={() => setViewingStatus(null)} />
      )}
    </div>
  );
};

const LockIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default App;