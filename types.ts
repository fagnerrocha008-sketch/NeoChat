export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or contactId
  senderName?: string; // For replies context
  text: string;
  type: 'text' | 'audio' | 'image';
  mediaUrl?: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    type: 'text' | 'audio' | 'image';
  };
  isStarred?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string; // Changed from phoneNumber
  avatar: string;
  about?: string; // Status/Bio like "Busy"
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline: boolean;
  isAI: boolean;
  hasStatus?: boolean; // If true, shows ring around avatar
  statusImage?: string; // URL for the status image
}

export interface ChatSession {
  contactId: string;
  messages: Message[];
}