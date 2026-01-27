import type { Part, Content } from '@google/genai';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: Part[];
  isLoading?: boolean;
  sources?: {
    uri: string;
    title: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export type ChatMode = 'standard' | 'fast' | 'deep' | 'research' | 'maps';

export type { Content };