export interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  language: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  isOpen?: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  conversations: number;
  lastActive: Date;
  status: 'active' | 'inactive';
}

export interface AnalyticsData {
  totalChats: number;
  activeUsers: number;
  totalMessages: number;
  avgResponseTime: string;
  satisfaction: number;
  dailyChats: number[];
  languages?: { name: string; count: number }[];
}
