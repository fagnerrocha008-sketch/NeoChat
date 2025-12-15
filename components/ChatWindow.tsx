import React, { useState, useRef, useEffect } from 'react';
import { Contact, Message } from '../types';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip, ChevronLeft, Sparkles, Mic, Image as ImageIcon, Camera, FileText, X, Reply, Trash2, Star, Copy, AlertTriangle, ArrowDown, Check, CheckCheck, Edit2 } from 'lucide-react';
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

const COMMON_EMOJIS = ["😂", "❤️", "👍", "🔥", "😍", "😮", "😢", "😠", "👏", "🎉", "🤔", "👀", "✨", "🚀", "🤖", "🇧🇷", "✅", "👋", "💪", "🙌"];

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'message' | 'chat';
    itemId?: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- SCROLL LOGIC ---
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Only auto-scroll if user is already near bottom or it's a new message from 'me'
    if (messages.length > 0) {
       const container = messagesContainerRef.current;
       if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
          const lastMessage = messages[messages.length - 1];
          if (isNearBottom || lastMessage.senderId === 'me') {
             scrollToBottom();
          }
       }
    }
  }, [messages, isTyping, replyingTo]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollButton(!isBottom);
    }
  };

  // --- UTILS ---
  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.toDateString() === d2.toDateString();
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- DELETE LOGIC ---
  const requestDeleteMessage = (messageId: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'message', itemId: messageId });
  };

  const requestDeleteChat = () => {
    setDeleteConfirmation({ isOpen: true, type: 'chat' });
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

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // --- AUDIO & FILE LOGIC ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleSendAudio(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = (audioUrl: string) => {
    onSendMessage("", 'audio', audioUrl, 'me', replyingTo || undefined);
    setReplyingTo(null);
    triggerResponse(""); 
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onSendMessage("Imagem", 'image', imageUrl, 'me', replyingTo || undefined);
      setReplyingTo(null);
      setShowAttachMenu(false);
      triggerResponse("Enviei uma imagem");
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
      try {
        const history = messages.map(m => ({
          role: m.senderId === 'me' ? 'user' : 'model',
          text: m.text
        }));
        history.push({ role: 'user', text: userText });
        const responseText = await generateAIResponse(history, userText);
        setIsTyping(false);
        onSendMessage(responseText, 'text', undefined, contact.id);
      } catch (e) {
        setIsTyping(false);
      }
    } else {
      setTimeout(() => {
        setIsTyping(false);
        onSendMessage("Interessante!", 'text', undefined, contact.id);
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendText();
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden relative">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[20%] w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute top-[40%] -left-[20%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 h-full relative transition-all duration-300 z-10 ${showProfile ? 'w-2/3' : 'w-full'}`}>
        
        {/* Header */}
        <div className="px-6 py-3 bg-dark-950/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowProfile(true)}>
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden text-gray-400 hover:text-white">
              <ChevronLeft size={24} />
            </button>
            
            <div className="relative">
              <img 
                src={contact.avatar} 
                alt={contact.name} 
                className="w-11 h-11 rounded-full object-cover border-2 border-transparent hover:border-primary-500/50 transition-colors"
              />
              {contact.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 border-2 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-lg text-white flex items-center gap-2 leading-none">
                {contact.name}
                {contact.isAI && <Sparkles size={14} className="text-blue-400 animate-pulse" />}
              </h3>
              <span className="text-xs text-primary-400/80 font-medium h-4 mt-1">
                {isTyping ? <span className="animate-pulse">digitando...</span> : (contact.isOnline ? 'Online' : 'Visto por último hoje')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onCall('video')} className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"><Video size={20} /></button>
            <button onClick={() => onCall('voice')} className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"><Phone size={20} /></button>
            <button className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative z-10 scrollbar-thin"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.map((msg, index) => {
            const isMe = msg.senderId === 'me';
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            
            // Logic for visual grouping
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
            
            // Logic for Date Separators
            const showDateSeparator = !prevMsg || !isSameDay(new Date(prevMsg.timestamp), new Date(msg.timestamp));

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-6 sticky top-2 z-10 opacity-90">
                    <span className="glass-light px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-400 uppercase tracking-wider shadow-lg">
                      {formatMessageDate(new Date(msg.timestamp))}
                    </span>
                  </div>
                )}

                <div 
                  className={`flex w-full group/msg relative ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {/* Context Menu (Floating Actions) */}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} h-full flex items-center opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 z-10`}>
                    <div className="flex gap-1 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                      <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Responder"><Reply size={14} /></button>
                      {msg.type === 'text' && (
                         <button onClick={() => handleCopyText(msg.text, msg.id)} className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="Copiar">
                            {copiedId === msg.id ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                         </button>
                      )}
                      {isMe && (
                        <button onClick={() => requestDeleteMessage(msg.id)} className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors" title="Apagar"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>

                  <div 
                    className={`
                      max-w-[85%] md:max-w-[65%] shadow-lg text-sm relative transition-all duration-200
                      ${isMe 
                        ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-primary-900/20' 
                        : 'glass-bubble text-gray-100'
                      }
                      ${isFirstInGroup && isMe ? 'rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl rounded-br-md' : ''}
                      ${!isFirstInGroup && !isLastInGroup && isMe ? 'rounded-2xl rounded-br-md rounded-tr-md' : ''}
                      ${isLastInGroup && !isFirstInGroup && isMe ? 'rounded-tr-md rounded-tl-2xl rounded-bl-2xl rounded-br-2xl' : ''}
                      ${isFirstInGroup && isLastInGroup && isMe ? 'rounded-2xl rounded-tr-md' : ''}

                      ${isFirstInGroup && !isMe ? 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md' : ''}
                      ${!isFirstInGroup && !isLastInGroup && !isMe ? 'rounded-2xl rounded-bl-md rounded-tl-md' : ''}
                      ${isLastInGroup && !isFirstInGroup && !isMe ? 'rounded-tl-md rounded-tr-2xl rounded-br-2xl rounded-bl-2xl' : ''}
                      ${isFirstInGroup && isLastInGroup && !isMe ? 'rounded-2xl rounded-tl-md' : ''}
                    `}
                  >
                    {/* Replies */}
                    {msg.replyTo && (
                      <div className={`mx-2 mt-2 mb-1 rounded-lg p-2 border-l-2 text-xs cursor-pointer flex flex-col bg-black/20 ${isMe ? 'border-primary-300' : 'border-primary-500'}`}>
                         <span className={`font-bold mb-0.5 ${isMe ? 'text-primary-100' : 'text-primary-400'}`}>{msg.replyTo.senderName}</span>
                         <span className="truncate opacity-80">{msg.replyTo.type === 'image' ? '📷 Imagem' : (msg.replyTo.type === 'audio' ? '🎵 Áudio' : msg.replyTo.text)}</span>
                      </div>
                    )}

                    {/* Image */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="p-1.5 pb-0">
                        <img src={msg.mediaUrl} alt="Sent" className="rounded-xl max-h-80 w-full object-cover cursor-pointer hover:brightness-110 transition-all border border-white/5" onClick={() => window.open(msg.mediaUrl, '_blank')} />
                      </div>
                    )}

                    {/* Audio */}
                    {msg.type === 'audio' && msg.mediaUrl && (
                      <div className="flex items-center gap-3 min-w-[260px] p-4">
                         <button className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${isMe ? 'bg-white/20' : 'bg-primary-500/20 text-primary-400'}`}>
                           <Mic size={20} className={isMe ? "text-white" : ""} />
                         </button>
                         <div className="flex-1 flex flex-col gap-1">
                            <div className={`h-1 rounded-full w-full ${isMe ? 'bg-white/30' : 'bg-gray-600'}`}>
                               <div className={`h-full w-1/3 rounded-full ${isMe ? 'bg-white' : 'bg-primary-500'}`}></div>
                            </div>
                            <span className="text-[10px] opacity-70">0:00 / 0:12</span>
                         </div>
                      </div>
                    )}

                    {/* Text */}
                    {msg.text && (
                       <p className={`whitespace-pre-wrap leading-relaxed px-4 pt-2 ${msg.type === 'image' ? 'pb-2' : 'pb-1'} ${msg.replyTo ? 'pt-1' : ''} text-[15px]`}>
                         {msg.text}
                       </p>
                    )}
                    
                    {/* Footer / Status */}
                    <div className={`text-[10px] flex items-center justify-end gap-1 px-3 pb-1.5 opacity-60 font-medium`}>
                      {msg.isStarred && <Star size={10} className="fill-current text-yellow-400" />}
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                         <span className={msg.status === 'read' ? 'text-blue-200' : 'text-white/50'}>
                           {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
                         </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          
          {isTyping && (
             <div className="flex justify-start animate-fade-in mb-4">
               <div className="glass-bubble px-4 py-3 rounded-2xl rounded-tl-md flex gap-1.5 items-center">
                 <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce delay-0"></span>
                 <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce delay-150"></span>
                 <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce delay-300"></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Scroll To Bottom Button */}
        {showScrollButton && (
          <button 
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 z-20 bg-dark-800/80 backdrop-blur-md text-primary-400 p-2.5 rounded-full shadow-xl border border-white/10 hover:bg-dark-700 hover:scale-110 transition-all animate-bounce-small"
          >
            <ArrowDown size={20} />
          </button>
        )}

        {/* Floating Input Area */}
        <div className="px-4 pb-4 pt-2 z-20">
          
          {/* Reply Context Panel (Floating) */}
          {replyingTo && (
             <div className="mb-2 mx-2 bg-dark-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between animate-slide-up shadow-2xl">
                <div className="flex flex-col overflow-hidden mr-4 border-l-4 border-primary-500 pl-3">
                   <span className="text-primary-400 font-bold text-xs mb-0.5">Respondendo a {replyingTo.senderId === 'me' ? 'Você' : contact.name}</span>
                   <span className="text-gray-300 text-sm truncate">{replyingTo.type === 'image' ? '📷 Imagem' : (replyingTo.type === 'audio' ? '🎵 Áudio' : replyingTo.text)}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                   <X size={18} className="text-gray-400" />
                </button>
             </div>
          )}

          <div className="relative">
             {/* Popups */}
             {showAttachMenu && (
              <div className="absolute bottom-16 left-0 z-30 flex flex-col gap-2 animate-scale-in origin-bottom-left">
                <div className="flex flex-col gap-3 glass p-4 rounded-2xl shadow-2xl mb-2 min-w-[180px]">
                  <label className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-white/5 rounded-lg transition-colors">
                    <div className="p-2 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg">
                       <FileText size={18} />
                    </div>
                    <span className="text-gray-200 text-sm font-medium">Documento</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-white/5 rounded-lg transition-colors">
                    <div className="p-2 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-lg">
                       <Camera size={18} />
                    </div>
                    <span className="text-gray-200 text-sm font-medium">Câmera</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group p-1 hover:bg-white/5 rounded-lg transition-colors">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    <div className="p-2 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg">
                       <ImageIcon size={18} />
                    </div>
                    <span className="text-gray-200 text-sm font-medium">Galeria</span>
                  </label>
                </div>
              </div>
            )}

            {showEmojiPicker && (
              <div className="absolute bottom-16 left-0 z-30 glass border border-white/5 rounded-2xl shadow-2xl p-3 animate-scale-in origin-bottom-left w-72">
                <div className="grid grid-cols-6 gap-1 max-h-60 overflow-y-auto scrollbar-thin">
                  {COMMON_EMOJIS.map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => addEmoji(emoji)}
                      className="text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="glass rounded-[2rem] p-1.5 flex items-end gap-2 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-1 pl-2 pb-1.5">
                 <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-all hover:bg-white/10 ${showEmojiPicker ? 'text-primary-400' : 'text-gray-400'}`}
                >
                  <Smile size={24} />
                </button>
                <button 
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`p-2 rounded-full transition-all hover:bg-white/10 ${showAttachMenu ? 'text-primary-400 rotate-45' : 'text-gray-400'}`}
                >
                  <Paperclip size={22} className={!showAttachMenu ? "rotate-45" : ""} />
                </button>
              </div>

              <div className="flex-1 py-3">
                 <input
                  ref={inputRef}
                  type="text"
                  className="w-full bg-transparent text-white border-none outline-none placeholder:text-gray-500 text-[16px]"
                  placeholder="Mensagem..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={() => { setShowAttachMenu(false); setShowEmojiPicker(false); }}
                />
              </div>

              <div className="pr-1 pb-1">
                 <button 
                   onMouseDown={inputText.length === 0 ? startRecording : undefined}
                   onMouseUp={inputText.length === 0 ? stopRecording : undefined}
                   onClick={inputText.length > 0 ? handleSendText : undefined}
                   className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-90
                     ${inputText.length > 0 
                       ? 'bg-gradient-to-r from-primary-500 to-emerald-400 text-black shadow-primary-500/30 hover:shadow-primary-500/50' 
                       : (isRecording ? 'bg-red-500 animate-pulse text-white shadow-red-500/40' : 'bg-dark-800 text-white hover:bg-dark-700')
                     }`}
                >
                  {inputText.length > 0 ? (
                    <Send size={20} className="-ml-0.5" />
                  ) : (
                    <Mic size={22} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sidebar */}
      {showProfile && (
        <div className="w-[400px] hidden md:block h-full border-l border-white/5 z-20 glass shadow-2xl">
          <ProfileSidebar 
            contact={contact} 
            onClose={() => setShowProfile(false)} 
            onDeleteChat={requestDeleteChat}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#18181b] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500 blur-[20px] opacity-50"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {deleteConfirmation.type === 'message' ? 'Apagar mensagem?' : 'Apagar conversa?'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {deleteConfirmation.type === 'message' 
                  ? 'Essa ação não pode ser desfeita. A mensagem será removida para você.'
                  : 'Tem certeza que deseja apagar todo o histórico dessa conversa? Essa ação é irreversível.'
                }
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={cancelDelete} className="flex-1 py-3 px-4 rounded-xl bg-dark-800 text-white hover:bg-dark-700 transition-colors font-medium border border-white/5">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors font-medium shadow-lg shadow-red-900/30">Apagar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};