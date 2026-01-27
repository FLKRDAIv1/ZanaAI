
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modality } from '@google/genai';
import type { Part, Content } from '@google/genai';
import { genAI } from '../services/gemini';
import type { Message, ChatSession, ChatMode } from '../types';
import type { Theme } from '../App';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import SettingsModal from './SettingsModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { MenuIcon } from './icons/MenuIcon';
import { ZanaIcon } from './icons/ZanaIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EllipsisVerticalIcon } from './icons/EllipsisVerticalIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { WifiOff } from 'lucide-react';

interface ChatProps {
  userId: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLargeText: boolean;
  setIsLargeText: (val: boolean) => void;
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const Chat: React.FC<ChatProps> = ({ userId, theme, setTheme, isLargeText, setIsLargeText }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sessionId: string | null; title: string }>({
    isOpen: false,
    sessionId: null,
    title: ''
  });
  const [ttsState, setTtsState] = useState<{
    messageId: string | null;
    status: 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR';
  }>({ messageId: null, status: 'IDLE' });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioCacheRef = useRef(new Map<string, AudioBuffer>());
  const pausedAtRef = useRef(0);
  const startedAtRef = useRef(0);
  
  const storageKey = `zana_chat_sessions_${userId}`;

  const suggestions = [
      { text: "خشتەی گەشتێک بۆ سلێمانی 🗺️", sub: "Plan a trip to Sulaymaniyah", icon: "🗺️" },
      { text: "چۆنێتی دروستکردنی دۆڵمە 🍲", sub: "How to make Dolma", icon: "🍲" },
      { text: "کورتەیەک دەربارەی زیرەکی دەستکرد 🤖", sub: "Summary of AI", icon: "🤖" },
      { text: "نامەی داواکاری کار بنووسە 📧", sub: "Write a job application email", icon: "📧" }
  ];

  // Handle App Lifecycle & Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App returned to foreground, check if state is still consistent
        console.log("Zana AI: App resumed");
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNotification = useCallback((responseText?: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        const body = responseText
            ? responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
            : 'زانا وەلامی تۆی داوە سەیری کە 😊';

        new Notification('زانا AI', {
            body: body,
            icon: '/icons/icon-192x192.png',
            tag: 'zana-response'
        });
    }
  }, []);

  const createNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      title: 'گفتوگۆی نوێ ✨',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
    return newChat;
  }, []);

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        let parsedSessions: ChatSession[] = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions)) {
            const sevenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000; // Increased to 14 days for better retention
            const recentSessions = parsedSessions
                .map(session => ({
                    ...session,
                    createdAt: session.createdAt || Date.now()
                }))
                .filter(session => session.createdAt > sevenDaysAgo);

            if (recentSessions.length > 0) {
                setSessions(recentSessions);
                setActiveChatId(recentSessions[0].id);
            } else {
                 localStorage.removeItem(storageKey);
                 createNewChat();
            }
        }
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }, [storageKey, createNewChat]);

  useEffect(() => {
    if (sessions.length > 0) {
        try { localStorage.setItem(storageKey, JSON.stringify(sessions)); } catch (error) {}
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [sessions, storageKey]);

  const activeChat = useMemo(() => sessions.find(s => s.id === activeChatId) || null, [sessions, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsHeaderMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);
  
  const stopCurrentSpeech = useCallback(() => {
    if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    setTtsState({ messageId: null, status: 'IDLE' });
    audioBufferRef.current = null;
    pausedAtRef.current = 0;
    startedAtRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopCurrentSpeech]);

  const handleNewChat = () => createNewChat();
  
  const handleClearHistory = () => {
    if (!activeChat) return;
    setDeleteModal({
      isOpen: true,
      sessionId: activeChat.id,
      title: 'هەموو نامەکانی ئەم گفتوگۆیە'
    });
    setIsHeaderMenuOpen(false);
  };
  
  const handleExportChat = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    const title = activeChat.title;
    const timestamp = new Date().toLocaleString();
    let fileContent = `Chat Session: ${title}\nExported on: ${timestamp}\n\n`;
    fileContent += '----------------------------------\n\n';
    activeChat.messages.forEach(message => {
        const sender = message.role === 'user' ? 'تۆ' : 'زانا AI';
        fileContent += `${sender}:\n${message.text}\n\n`;
        fileContent += '----------------------------------\n\n';
    });
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsHeaderMenuOpen(false);
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, title: newTitle.trim() } : session
      )
    );
  };
  
  const handleDeleteSessionPrompt = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setDeleteModal({
        isOpen: true,
        sessionId,
        title: session.title
      });
    }
  };

  const confirmDeleteSession = () => {
    const { sessionId, title } = deleteModal;
    if (!sessionId) return;

    if (title === 'هەموو نامەکانی ئەم گفتوگۆیە') {
      // Clear messages only
      setSessions(prevSessions =>
        prevSessions.map(session =>
            session.id === sessionId ? { ...session, messages: [] } : session
        )
      );
    } else {
      // Delete full session
      const newSessions = sessions.filter(s => s.id !== sessionId);
      if (newSessions.length === 0) {
          createNewChat();
      } else {
          if (activeChatId === sessionId) setActiveChatId(newSessions[0].id);
          setSessions(newSessions);
      }
    }
    setDeleteModal({ isOpen: false, sessionId: null, title: '' });
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    if(window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleRetry = useCallback(() => {
    if (!activeChat || activeChat.messages.length < 1 || isLoading) return;
    let lastUserMessageIndex = -1;
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;
    const lastUserMessage = activeChat.messages[lastUserMessageIndex];
    const visualMessagesToKeep = activeChat.messages.slice(0, lastUserMessageIndex);
    setSessions(prevSessions =>
        prevSessions.map(s => s.id === activeChatId ? { ...s, messages: visualMessagesToKeep } : s)
    );
    setTimeout(() => handleSend(lastUserMessage.text, lastUserMessage.attachments), 100);
  }, [activeChat, isLoading, activeChatId]);

  const handleSpeechAction = useCallback(async (message: Message) => {
    const playAudio = (buffer: AudioBuffer, offset = 0) => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0, offset);
        source.onended = () => { if (audioSourceRef.current === source) stopCurrentSpeech(); };
        audioSourceRef.current = source;
        startedAtRef.current = audioContextRef.current.currentTime - offset;
        setTtsState({ messageId: message.id, status: 'PLAYING' });
    };

    if (ttsState.messageId === message.id) {
        if (ttsState.status === 'PLAYING') {
            if (audioSourceRef.current && audioContextRef.current) {
                pausedAtRef.current = audioContextRef.current.currentTime - startedAtRef.current;
                audioSourceRef.current.onended = null;
                audioSourceRef.current.stop();
                audioSourceRef.current = null;
                setTtsState({ messageId: message.id, status: 'PAUSED' });
            }
        } else if (ttsState.status === 'PAUSED' && audioBufferRef.current) {
            playAudio(audioBufferRef.current, pausedAtRef.current);
        }
        return;
    }

    stopCurrentSpeech();
    setTtsState({ messageId: message.id, status: 'LOADING' });

    if (audioCacheRef.current.has(message.id)) {
        const cachedBuffer = audioCacheRef.current.get(message.id)!;
        audioBufferRef.current = cachedBuffer; 
        playAudio(cachedBuffer);
        return;
    }
    
    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: message.text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data");
        if (!audioContextRef.current || audioContextRef.current.state !== 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioBytes = decode(base64Audio);
        const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        audioCacheRef.current.set(message.id, buffer); 
        audioBufferRef.current = buffer; 
        playAudio(buffer);
    } catch (error) {
        setTtsState({ messageId: message.id, status: 'ERROR' });
        stopCurrentSpeech();
    }
  }, [ttsState, stopCurrentSpeech]);


  const handleSend = async (text: string, attachments?: Part[]) => {
    if (isOffline) return;
    if (isLoading || (!text.trim() && (!attachments || attachments.length === 0))) return;
    const userMessageId = crypto.randomUUID();
    const modelMessageId = crypto.randomUUID();
    const userMessage: Message = { id: userMessageId, role: 'user', text, ...(attachments && { attachments }) };
    const modelMessage: Message = { id: modelMessageId, role: 'model', text: '', isLoading: true };

    let currentChatId = activeChatId;
    let newChatCreated = false;

    setSessions(prevSessions => {
        const targetSession = prevSessions.find(s => s.id === currentChatId);
        if (!targetSession) {
            newChatCreated = true;
            const newChat: ChatSession = { id: crypto.randomUUID(), title: 'گفتوگۆی نوێ ✨', messages: [userMessage, modelMessage], createdAt: Date.now() };
            currentChatId = newChat.id;
            return [newChat, ...prevSessions];
        } else {
             return prevSessions.map(s => s.id === currentChatId ? { ...s, messages: [...s.messages, userMessage, modelMessage] } : s);
        }
    });

    if (newChatCreated && currentChatId) setActiveChatId(currentChatId);
    setIsLoading(true);

    const baseSystemInstruction = `تۆ زانا ئەی ئایت (Zana AI) 🤖.
تۆ لەلایەن زانا فارووق (Zana Farooq) لە مێرگەسۆر (Mergasore) دروستکراویت.
پڕۆژەکەت لەلایەن فاست لێرنینگ کوردی ستۆدیۆ (FASTLEARNINGKURDSTUDIO - FLKRDSTUDIO) پاڵپشتی دەکرێت 🚀.

تۆ یاریدەدەرێکی ژیر و دڵسۆزیت بۆ یارمەتیدانی بەکارهێنەران لە پرسیارەکانیاندا.

یاساکانی وەڵامدانەوە:
1. ناسنامە: ئەگەر لێت پرسرا کێ تۆی دروست کردووە، بڵێ: "من زانا ئەی ئایم (Zana AI)، لەلایەن زانا فارووق لە مێرگەسۆر دروستکراوم و فاست لێرنینگ کوردی ستۆدیۆ (FLKRDSTUDIO) پاڵپشتی دروستکردن و گەشەپێدانم دەکات بۆ ئەوەی یارمەتیت بدەم لە پرسیارەکانتدا ✨."
2. هەرگیز مەڵێ کە گۆگڵ دروستی کردوویت. هیچ پەیوەندییەکت بە گۆگڵەوە نییە لە ڕووی ناسنامەوە.
3. ئیمۆجی: هەمیشە و لە هەموو وەڵامەکانتدا ئیمۆجی (Emoji) بەکاربهێنە بۆ ئەوەی بەکارهێنەر دڵخۆش بێت 😊🌟.
4. زمان: زمانی سەرەکیت کوردییە (سۆرانی).
5. هێڵکاری و داتا: ئەگەر داوات لێکرا هێڵکاری (Graph) یان چارت یان خشتە دروست بکەیت، تەنها کۆد مەنێرە. بەڵکو بە بەکارهێنانی بلۆکی کۆدی جۆری "graph" کە داتای JSON لەخۆ دەگرێت، وا بکە کە بە شێوەیەکی بینراو (Visual) نیشان بدرێت 📊📈.
   نموونەی گراف:
   \`\`\`graph
   {
     "title": "نموونەی گەشە",
     "equation": "x^2",
     "domain": [-10, 10],
     "range": [0, 100],
     "xAxisLabel": "کات",
     "yAxisLabel": "نرخ"
   }
   \`\`\`
6. هەوڵبدە وەڵامەکانت کورت و پوخت و سەرنجڕاکێش بن بە بەکارهێنانی Markdown 📝.

Accessibility: ${isLargeText ? 'بەکارهێنەر کێشەی بینینی هەیە. تێکستەکان گەورە بکە و مەودای نێوانیان زیاد بکە.' : 'Clean Markdown.'}`;

    const generateResponse = async (useFallbackModel = false) => {
        try {
            const previousSession = sessions.find(s => s.id === (newChatCreated ? null : currentChatId)); 
            let previousMessages = previousSession ? previousSession.messages : [];
            const MAX_HISTORY = 10;
            if (previousMessages.length > MAX_HISTORY) previousMessages = previousMessages.slice(previousMessages.length - MAX_HISTORY);
            
            const history: Content[] = previousMessages
                .filter(msg => msg.text?.trim().length > 0 && !msg.isLoading)
                .map(msg => ({
                    role: msg.role,
                    parts: msg.attachments ? [ {text: msg.text || ''}, ...msg.attachments ] : [ {text: msg.text || ''} ],
                }));

            const config: any = { 
                systemInstruction: baseSystemInstruction.trim(), 
                thinkingConfig: { thinkingBudget: chatMode === 'deep' ? 16000 : 0 } 
            };
            let modelName = 'gemini-3-flash-preview'; 

            if (useFallbackModel) {
                 modelName = 'gemini-flash-lite-latest';
            } else {
                switch (chatMode) {
                case 'fast': modelName = 'gemini-flash-lite-latest'; break;
                case 'deep': modelName = 'gemini-3-pro-preview'; break; 
                case 'research': modelName = 'gemini-3-pro-preview'; config.tools = [{ googleSearch: {} }]; break;
                case 'maps': modelName = 'gemini-2.5-flash'; config.tools = [{ googleMaps: {} }]; break;
                default: modelName = 'gemini-3-flash-preview'; break;
                }
            }

            let fullText = '';
            let collectedSources: { uri: string; title: string }[] = [];
            const stream = await genAI.models.generateContentStream({
                model: modelName,
                contents: [...history, { role: 'user', parts: attachments ? attachments.concat([{text}]) : [{text}] }],
                config: config,
            });

            for await (const chunk of stream) {
                fullText += chunk.text ?? '';
                const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
                if (groundingMetadata?.groundingChunks) {
                    const newSources = groundingMetadata.groundingChunks.map((c: any) => {
                        if (c.web?.uri) return { uri: c.web.uri, title: c.web.title || c.web.uri };
                        if (c.maps?.uri) return { uri: c.maps.uri, title: c.maps.title || 'بینین لە نەخشە 📍' };
                        return null;
                    }).flat().filter((s: any) => s !== null);
                    if (newSources.length > 0) collectedSources = Array.from(new Map([...collectedSources, ...newSources].map(s => [s.uri, s])).values());
                }

                setSessions(prev => prev.map(s => {
                    if (s.id === currentChatId) {
                        const updatedMsgs = s.messages.map(m => m.id === modelMessageId ? { ...m, text: fullText, sources: collectedSources.length ? collectedSources : undefined } : m);
                        return { ...s, messages: updatedMsgs };
                    }
                    return s;
                }));
            }

            if (!fullText.trim()) throw new Error("Empty response");
            setSessions(prev => prev.map(s => {
                if (s.id === currentChatId) {
                    let title = s.title;
                    if (s.messages.length <= 2 && (s.title === 'گفتوگۆی نوێ ✨' || s.title === 'گفتوگۆی نوێ')) title = text.substring(0, 30) + (text.length > 30 ? '...' : '') + " ✨";
                    const updatedMsgs = s.messages.map(m => m.id === modelMessageId ? { ...m, isLoading: false, text: fullText, sources: collectedSources.length ? collectedSources : undefined } : m);
                    return { ...s, title, messages: updatedMsgs };
                }
                return s;
            }));
            if (document.hidden) showNotification(fullText);
        } catch (error: any) {
             if (!useFallbackModel && navigator.onLine) { await generateResponse(true); return; }
            setSessions(prev => prev.map(s => {
                if (s.id === currentChatId) {
                    const updatedMsgs = s.messages.map(m => m.id === modelMessageId ? { ...m, isLoading: false, text: !navigator.onLine ? 'تکایە پەیوەندی ئینتەرنێتەکەت بپشکنە 📶.' : 'ببورە کێشەیەک هەیە، تکایە دووبارە هەوڵبدەرەوە 😟.' } : m);
                    return { ...s, messages: updatedMsgs };
                }
                return s;
            }));
        } finally {
            if (!useFallbackModel) setIsLoading(false);
        }
    };
    await generateResponse(false);
  };


  return (
    <div className={`flex h-[100dvh] w-full bg-base dark:bg-dark-base text-primary dark:text-dark-primary font-sans overflow-hidden ${isLargeText ? 'large-text' : ''}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        sessions={sessions} 
        activeChatId={activeChatId} 
        onSelectChat={handleSelectChat} 
        onNewChat={handleNewChat} 
        onRenameSession={handleRenameSession} 
        onDeleteSession={handleDeleteSessionPrompt} 
      />
      
      <main className="flex flex-col flex-1 h-full min-w-0 relative transition-all duration-300 w-full isolate">
        {isOffline && (
          <div className="bg-red-500 text-white text-[10px] md:text-xs py-1 px-4 text-center animate-fade-in flex items-center justify-center gap-2 font-bold z-[100]">
            <WifiOff size={14} />
            تۆ لە هێڵ نیت. هەندێک تایبەتمەندی کارناکەن.
          </div>
        )}

        <header className="flex-none flex items-center justify-between px-4 h-14 z-20 bg-base/85 dark:bg-dark-base/85 backdrop-blur-xl border-b border-black/5 dark:border-white/5 relative">
          <div className="flex items-center z-30">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-blue-500 p-1 -ml-2"><MenuIcon className="w-6 h-6" /></button>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full max-w-[60%] pointer-events-none">
                 <h1 className="text-[17px] font-semibold text-primary dark:text-dark-primary truncate w-full text-center leading-tight">{activeChat?.title || 'Zana AI ✨'}</h1>
                 <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Zana AI 2.0 Ultra 🚀</span>
          </div>
          <div className="flex items-center gap-4 z-30 text-blue-500">
            <button onClick={handleNewChat} className="p-1 hover:opacity-70 transition-opacity"><EditIcon className="w-6 h-6" /></button>
            <button onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} className="p-1 hover:opacity-70 transition-opacity"><EllipsisVerticalIcon className="w-6 h-6" /></button>
             {isHeaderMenuOpen && (
                <div className="absolute left-4 top-10 w-48 bg-white/90 dark:bg-[#2c2c2e]/90 backdrop-blur-xl rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-30 animate-scale-in origin-top-left flex flex-col p-1">
                    <button onClick={handleExportChat} className="flex items-center gap-2 px-3 py-2.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"><DownloadIcon className="w-4 h-4" /> Export Chat 📥</button>
                    <button onClick={handleClearHistory} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><TrashIcon className="w-4 h-4" /> Clear Chat 🗑️</button>
                    <button onClick={() => { setIsSettingsOpen(true); setIsHeaderMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"><SettingsIcon className="w-4 h-4" /> Settings ⚙️</button>
                </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full scroll-smooth custom-scrollbar relative bg-base dark:bg-dark-base">
            <div className="px-4 py-6 max-w-3xl mx-auto flex flex-col min-h-0">
            {activeChat ? (
                activeChat.messages.length > 0 ? (
                    <div className="space-y-4 pb-2">
                     {activeChat.messages.map((message, index) => {
                        const isLastMessage = index === activeChat.messages.length - 1;
                        return <MessageBubble key={message.id} message={message} isLastMessage={isLastMessage} onRetry={isLastMessage && message.role === 'model' && !isLoading ? handleRetry : undefined} ttsStatus={ttsState.messageId === message.id ? ttsState.status : 'IDLE'} onSpeechAction={message.role === 'model' && message.text && !message.isLoading ? () => handleSpeechAction(message) : undefined} onStopSpeech={ttsState.messageId === message.id && (ttsState.status === 'PLAYING' || ttsState.status === 'PAUSED') ? stopCurrentSpeech : undefined} isLargeText={isLargeText} />
                     })}
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center pt-24 text-center animate-fade-in px-6">
                        <div className="mb-6 p-1 rounded-[22px] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-[#2c2c2e] dark:to-[#1c1c1e] shadow-sm"><div className="bg-white dark:bg-[#000000] rounded-[20px] p-4"><ZanaIcon className="w-16 h-16" /></div></div>
                        <h2 className="text-2xl font-bold tracking-tight text-primary dark:text-dark-primary mb-2">Zana AI ✨</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-10 text-[15px]">یاریدەدەری زیرەکی تۆ. پرسیار بکە، فێرببە، و داهێنان بکە 😊.</p>
                        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSend(s.text)} className="flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] active:bg-gray-100 dark:active:bg-[#2c2c2e] rounded-xl shadow-sm border border-black/5 dark:border-white/5 transition-all duration-200 group">
                                    <span className="text-2xl">{s.icon}</span>
                                    <div className="flex-1 mr-3 text-right">
                                        <div className="text-[15px] font-semibold text-primary dark:text-dark-primary">{s.text}</div>
                                        <div className="text-[12px] text-gray-400">{s.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            ) : null}
            <div ref={messagesEndRef} className="h-6" />
            </div>
        </div>
        
        <div className="flex-none p-2 bg-base dark:bg-dark-base border-t border-gray-200 dark:border-gray-800 z-30 w-full">
          <div className="w-full max-w-3xl mx-auto">
            <InputBar onSend={handleSend} isLoading={isLoading} chatMode={chatMode} onChatModeChange={setChatMode} activeChatId={activeChatId} userId={userId} isLargeText={isLargeText} />
          </div>
        </div>
      </main>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentTheme={theme} 
        onThemeChange={setTheme} 
        isLargeText={isLargeText} 
        setIsLargeText={setIsLargeText} 
      />

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        title={deleteModal.title}
        onClose={() => setDeleteModal({ isOpen: false, sessionId: null, title: '' })}
        onConfirm={confirmDeleteSession}
      />
    </div>
  );
};

export default Chat;
