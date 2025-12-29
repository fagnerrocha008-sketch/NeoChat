import React, { useState, useRef, useEffect } from 'react';
import { Contact, Message } from '../types';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip, ChevronLeft, Sparkles, Mic, Image as ImageIcon, Camera, FileText, X, Reply, Trash2, Star, Copy, AlertTriangle, ArrowDown, Check, CheckCheck } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { ProfileSidebar } from './ProfileSidebar';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string, type: 'text' | 'audio' | 'image', mediaUrl?: string, senderId?: string, replyTo?: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onDeleteChat: () => void;
  onBack: () => void;
  onCall: (type: 'voice' | 'video') => void;
}

const COMMON_EMOJIS = ["😂", "❤️", "👍", "🔥", "😍", "😮", "😢", "😠", "👏", "🎉", "🤔", "👀", "✨", "🚀", "🤖", "✅", "👋", "💪", "🙌"];

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  contact, 
  messages, 
  onSendMessage,
  onDeleteMessage,
  onDeleteChat,
  onBack,
  onCall
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'message' | 'chat';
    itemId?: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, replyingTo]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!nearBottom);
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const formatSeparatorDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return 'Hoje';
    if (isSameDay(date, yesterday)) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const confirmDelete = () => {
    if (deleteConfirmation?.type === 'message' && deleteConfirmation.itemId) {
      onDeleteMessage(deleteConfirmation.itemId);
    } else if (deleteConfirmation?.type === 'chat') {
      onDeleteChat();
      setShowProfile(false);
    }
    setDeleteConfirmation(null);
  };

  // --- AUDIO LOGIC ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioUrl = URL.createObjectURL(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        onSendMessage("", 'audio', audioUrl, 'me', replyingTo || undefined);
        setReplyingTo(null);
        triggerResponse("");
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) { alert("Permissão de microfone negada."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- TEXT LOGIC ---
  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    setShowEmojiPicker(false);
    onSendMessage(text, 'text', undefined, 'me', replyingTo || undefined);
    setReplyingTo(null);
    triggerResponse(text);
  };

  const triggerResponse = async (userText: string) => {
    setIsTyping(true);
    if (contact.isAI) {
      const history = messages.map(m => ({ role: m.senderId === 'me' ? 'user' : 'model', text: m.text }));
      history.push({ role: 'user', text: userText });
      const responseText = await generateAIResponse(history, userText);
      setIsTyping(false);
      onSendMessage(responseText, 'text', undefined, contact.id);
    } else {
      setTimeout(() => {
        setIsTyping(false);
        onSendMessage("Opa! Tudo certo.", 'text', undefined, contact.id);
      }, 2000);
    }
  };

  return (
    <div className="flex h-full bg-[#0b141a] overflow-hidden relative">
      <div className={`flex flex-col flex-1 h-full relative transition-all duration-300 z-10 ${showProfile ? 'w-2/3' : 'w-full'}`}>
        
        {/* Header */}
        <div className="px-4 py-2 bg-[#202c33] flex items-center justify-between z-20 shadow-md">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden text-gray-400">
              <ChevronLeft size={24} />
            </button>
            <img src={contact.avatar} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-100 leading-tight flex items-center gap-1.5">
                {contact.name}
                {contact.isAI && <Sparkles size={14} className="text-primary-400" />}
              </h3>
              <span className="text-[12px] text-gray-400">
                {isTyping ? "digitando..." : (contact.isOnline ? "online" : "visto por último hoje")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Video size={20} className="cursor-pointer hover:text-white" onClick={() => onCall('video')} />
            <Phone size={20} className="cursor-pointer hover:text-white" onClick={() => onCall('voice')} />
            <MoreVertical size={20} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Chat Background Doodle (Simulado via CSS) */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4 space-y-1 relative z-10 scrollbar-thin scroll-smooth"
          ref={containerRef}
          onScroll={handleScroll}
          style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: 'overlay', backgroundColor: '#0b141a' }}
        >
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === 'me';
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            
            const showDate = !prevMsg || !isSameDay(new Date(prevMsg.timestamp), new Date(msg.timestamp));
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || showDate;
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-[#182229] text-[12px] text-gray-400 px-3 py-1 rounded-lg shadow-sm font-medium uppercase tracking-wide">
                      {formatSeparatorDate(new Date(msg.timestamp))}
                    </span>
                  </div>
                )}

                <div 
                  className={`flex w-full group/msg relative ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <div 
                    className={`
                      max-w-[85%] md:max-w-[70%] px-2.5 py-1.5 shadow-sm text-[14.5px] relative
                      ${isMe ? 'bg-[#005c4b] text-white rounded-l-lg' : 'bg-[#202c33] text-gray-100 rounded-r-lg'}
                      ${isFirstInGroup && isMe ? 'rounded-tr-none rounded-br-lg' : ''}
                      ${isFirstInGroup && !isMe ? 'rounded-tl-none rounded-bl-lg' : ''}
                      ${!isFirstInGroup && isMe ? 'rounded-tr-lg' : ''}
                      ${!isFirstInGroup && !isMe ? 'rounded-tl-lg' : ''}
                      ${isLastInGroup ? 'rounded-b-lg' : ''}
                    `}
                  >
                    {/* Tail Simulation (WhatsApp style) */}
                    {isFirstInGroup && (
                      <div className={`absolute top-0 w-2 h-2 ${isMe ? '-right-2 border-t-[8px] border-t-[#005c4b] border-r-[8px] border-r-transparent' : '-left-2 border-t-[8px] border-t-[#202c33] border-l-[8px] border-l-transparent'}`} />
                    )}

                    {/* Reply Context */}
                    {msg.replyTo && (
                      <div className="mb-1 rounded bg-black/20 p-2 border-l-4 border-primary-500 text-[13px] opacity-80 truncate">
                        <span className="font-bold text-primary-400">{msg.replyTo.senderName}</span>
                        <p className="truncate">{msg.replyTo.text}</p>
                      </div>
                    )}

                    {msg.type === 'image' && msg.mediaUrl && (
                      <img src={msg.mediaUrl} className="rounded-md max-h-64 w-full object-cover mb-1 cursor-pointer" />
                    )}

                    <div className="flex items-end gap-2 flex-wrap">
                      <p className="flex-1 min-w-[50px] leading-relaxed">{msg.text}</p>
                      <div className="flex items-center gap-1 shrink-0 mb-[-2px]">
                        <span className="text-[11px] opacity-50 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <span className={msg.status === 'read' ? 'text-primary-400' : 'text-gray-400'}>
                            {msg.status === 'read' ? <CheckCheck size={14} /> : (msg.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} p-1 rounded-full bg-dark-800 text-gray-400 opacity-0 group-hover/msg:opacity-100 transition-opacity`}
                    >
                      <Reply size={16} />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-[#202c33] px-4 py-2 rounded-lg flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll To Bottom Button */}
        {showScrollButton && (
          <button onClick={() => scrollToBottom()} className="absolute bottom-24 right-6 p-2.5 bg-[#202c33] rounded-full shadow-lg text-primary-400 hover:bg-[#2a3942] z-20">
            <ArrowDown size={20} />
          </button>
        )}

        {/* Input Footer */}
        <div className="px-4 py-2.5 bg-[#202c33] flex items-end gap-2.5 z-20">
          <div className="flex items-center gap-1.5 mb-1 text-gray-400">
             <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 hover:text-white transition-colors">
               <Smile size={26} />
             </button>
             <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-1 hover:text-white transition-colors">
               <Paperclip size={24} className="rotate-45" />
             </button>
          </div>

          <div className="flex-1 bg-[#2a3942] rounded-xl flex flex-col overflow-hidden px-3 py-1.5 min-h-[44px] justify-center">
            {replyingTo && (
              <div className="flex items-center justify-between bg-black/20 rounded p-2 mb-2 border-l-4 border-primary-500 text-sm">
                <div className="truncate pr-4">
                   <span className="font-bold text-primary-400 block text-xs">Respondendo a {replyingTo.senderId === 'me' ? 'Você' : contact.name}</span>
                   <span className="text-gray-400 truncate">{replyingTo.text}</span>
                </div>
                <button onClick={() => setReplyingTo(null)}><X size={16} /></button>
              </div>
            )}
            <input
              type="text"
              className="bg-transparent text-white outline-none w-full py-1 placeholder:text-gray-500"
              placeholder="Mensagem"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            />
          </div>

          <button 
            onMouseDown={inputText.length === 0 ? startRecording : undefined}
            onMouseUp={inputText.length === 0 ? stopRecording : undefined}
            onClick={inputText.length > 0 ? handleSendText : undefined}
            className={`p-3 rounded-full flex items-center justify-center transition-all ${inputText.length > 0 ? 'bg-primary-500 text-white' : (isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary-500 text-white')}`}
          >
            {inputText.length > 0 ? <Send size={22} fill="currentColor" /> : <Mic size={22} />}
          </button>
        </div>
      </div>

      {showProfile && (
        <div className="w-[400px] hidden md:block border-l border-white/5 z-20 shadow-2xl">
          <ProfileSidebar contact={contact} onClose={() => setShowProfile(false)} onDeleteChat={onDeleteChat} />
        </div>
      )}

      {/* Emoji Picker Simples */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-50 bg-[#233138] border border-white/5 p-3 rounded-xl shadow-2xl grid grid-cols-6 gap-2 w-64 animate-fade-in">
          {COMMON_EMOJIS.map(e => (
            <button key={e} onClick={() => { setInputText(p => p + e); setShowEmojiPicker(false); }} className="text-xl hover:bg-white/5 p-1 rounded">{e}</button>
          ))}
        </div>
      )}
    </div>
  );
};