
import React, { useState, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import type { Part } from '@google/genai';
import { Modality, Blob as GenAI_Blob, LiveServerMessage } from '@google/genai';
import { genAI } from '../services/gemini';
import type { ChatMode } from '../types';
import PermissionPrimer from './PermissionPrimer';
import { useAutoResizeTextarea } from './hooks/use-auto-resize-textarea';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';
import ImageCropper from './ImageCropper';

// Icons
import { CornerRightUpIcon } from './icons/CornerRightUpIcon';
import { CameraIcon } from './icons/CameraIcon';
import { MicIcon } from './icons/MicIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ImageIcon } from './icons/ImageIcon';
import { VideoIcon } from './icons/VideoIcon';
import { AudioFileIcon } from './icons/AudioFileIcon';
import { StopIcon } from './icons/StopIcon';
import { SparkleIcon } from './icons/SparkleIcon';

// Mode Icons
import { StandardIcon } from './icons/StandardIcon';
import { FastIcon } from './icons/FastIcon';
import { DeepIcon } from './icons/DeepIcon';
import { ResearchIcon } from './icons/ResearchIcon';
import { EarthIcon } from './icons/EarthIcon';

interface InputBarProps {
  onSend: (text: string, attachments?: Part[]) => void;
  isLoading: boolean;
  chatMode: ChatMode;
  onChatModeChange: (mode: ChatMode) => void;
  userId: string | null;
  activeChatId: string | null;
  isLargeText?: boolean;
}

interface AttachmentPreview {
    url: string;
    type: 'image' | 'video' | 'audio';
    name: string;
    originalData?: string; // Base64
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): GenAI_Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] < 0 ? data[i] * 32768 : data[i] * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const InputBar: React.FC<InputBarProps> = ({ onSend, isLoading, chatMode, onChatModeChange, userId, activeChatId, isLargeText }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Part[]>([]);
  const [previews, setPreviews] = useState<AttachmentPreview[]>([]);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCaptioning, setIsCaptioning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Image Cropping States
  const [cropperData, setCropperData] = useState<{ image: string; index: number } | null>(null);

  const [permissionPrimer, setPermissionPrimer] = useState<{
      isOpen: boolean;
      type: 'camera' | 'microphone' | 'notification' | null;
      isDenied: boolean;
      onAllow: () => void;
  }>({ isOpen: false, type: null, isDenied: false, onAllow: () => {} });

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 200,
  });

  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sessionPromiseRef = useRef<ReturnType<typeof genAI.live.connect> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const draftStorageKey = userId && activeChatId ? `zana_chat_draft_${userId}_${activeChatId}` : null;

  useEffect(() => {
    setSubmitted(isLoading);
  }, [isLoading]);

  useEffect(() => {
      if (draftStorageKey) {
          const savedDraft = localStorage.getItem(draftStorageKey);
          if (savedDraft) {
            setText(savedDraft);
            setTimeout(() => adjustHeight(), 0);
          } else {
            setText('');
            setTimeout(() => adjustHeight(true), 0);
          }
      } else {
        setText('');
        setTimeout(() => adjustHeight(true), 0);
      }
  }, [draftStorageKey, adjustHeight]);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);
      adjustHeight();
      if (draftStorageKey) {
          if (newText) localStorage.setItem(draftStorageKey, newText);
          else localStorage.removeItem(draftStorageKey);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
            setIsModeSelectorOpen(false);
        }
        if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
            if (!containerRef.current?.contains(event.target as Node)) {
                 setIsAttachmentMenuOpen(false);
            }
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const requestPermission = useCallback(async (
    name: 'camera' | 'microphone',
    onGranted: () => void
  ) => {
    if (typeof navigator.permissions?.query !== 'function') {
      setPermissionPrimer({
        isOpen: true, type: name, isDenied: false,
        onAllow: () => {
          setPermissionPrimer(p => ({ ...p, isOpen: false }));
          onGranted();
        }
      });
      return;
    }
    try {
      const result = await navigator.permissions.query({ name: name as PermissionName });
      if (result.state === 'granted') onGranted();
      else if (result.state === 'prompt') {
          setPermissionPrimer({
              isOpen: true, type: name, isDenied: false,
              onAllow: () => {
                  setPermissionPrimer(p => ({ ...p, isOpen: false }));
                  onGranted();
              }
          });
      } else if (result.state === 'denied') {
          setPermissionPrimer({ isOpen: true, type: name, isDenied: true, onAllow: () => {} });
      }
    } catch (error) {
      setPermissionPrimer({
          isOpen: true, type: name, isDenied: false,
          onAllow: () => {
              setPermissionPrimer(p => ({ ...p, isOpen: false }));
              onGranted();
          }
      });
    }
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const filePromises = Array.from(files).map((file: File) => {
        return new Promise<{ part: Part; preview: AttachmentPreview }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const base64Data = (reader.result as string) || '';
              // Safely handle strings that might not have a comma
              const parts = base64Data.split(',');
              const base64String = parts.length > 1 ? parts[1] : parts[0];
              
              let type: 'image' | 'video' | 'audio' = 'image';
              if (file.type.startsWith('video/')) type = 'video';
              else if (file.type.startsWith('audio/')) type = 'audio';

              resolve({
                part: { inlineData: { mimeType: file.type, data: base64String } },
                preview: {
                    url: URL.createObjectURL(file),
                    type,
                    name: file.name,
                    originalData: base64Data
                }
              });
            } catch (err) { reject(err); }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const results = await Promise.all(filePromises);
        const newParts = results.map(r => r.part);
        const newPreviews = results.map(r => r.preview);
        setAttachments(prev => [...prev, ...newParts]);
        setPreviews(prev => [...prev, ...newPreviews]);
      } catch (error) {
        console.error("Error processing files:", error);
      }
    }
    event.target.value = '';
  };

  const handleAttachmentClick = (source: 'gallery' | 'camera' | 'video' | 'audio') => {
    const triggerFileInput = (accept: string, capture?: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = true;
        if (capture) input.setAttribute('capture', capture);
        
        input.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            if (target.files) handleFileChange({ target } as ChangeEvent<HTMLInputElement>);
        };
        input.click();
    };

    if (source === 'camera') {
        requestPermission('camera', () => triggerFileInput('image/*', 'environment'));
    } else if (source === 'gallery') {
        triggerFileInput('image/*');
    } else if (source === 'video') {
        triggerFileInput('video/*');
    } else if (source === 'audio') {
        triggerFileInput('audio/*');
    }
    
    setIsAttachmentMenuOpen(false);
  };

  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('تۆمارکردنی دەنگ پشتگیری ناکرێت.');
            return;
        }
        setIsRecording(true);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = context;

        sessionPromiseRef.current = genAI.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    const source = context.createMediaStreamSource(stream);
                    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(context.destination);
                },
                onmessage: (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        const newText = (message.serverContent.inputTranscription as any).text;
                        setText(prev => {
                          const val = prev + newText;
                          adjustHeight(); 
                          return val;
                        });
                    }
                     if (message.serverContent?.turnComplete) {
                        setText(prev => prev.trim() + ' ');
                     }
                },
                onerror: (e: ErrorEvent) => {
                     if (e.message?.includes('Permission denied')) {
                      setPermissionPrimer({ isOpen: true, type: 'microphone', isDenied: true, onAllow: () => {} });
                    }
                    stopRecording();
                },
                onclose: () => stopRecording(),
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
            },
        });
      } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setPermissionPrimer({ isOpen: true, type: 'microphone', isDenied: true, onAllow: () => {} });
          }
          stopRecording();
      }
  }, [stopRecording, adjustHeight]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else requestPermission('microphone', startRecording);
  }, [isRecording, startRecording, stopRecording, requestPermission]);

  useEffect(() => {
      return () => stopRecording();
  }, [stopRecording]);
  
  const handleGenerateCaption = async () => {
    if (!attachments.length || isCaptioning || isLoading || previews.some(p => p.type !== 'image')) return;
    setIsCaptioning(true);
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [...attachments, { text: 'وەسفێکی یەک ڕستەیی زۆر کورت بۆ ئەم وێنەیە بنووسە.' }]
        },
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
      const caption = response.text;
      setText(prev => {
         const val = prev ? `${prev}\n${caption}` : caption;
         setTimeout(adjustHeight, 0);
         return val;
      });
    } catch (error) {
      console.error("Error generating caption:", error);
    } finally {
      setIsCaptioning(false);
    }
  };

  const handleSend = () => {
    if (isLoading || (!text.trim() && attachments.length === 0)) return;
    setSubmitted(true);
    setTimeout(() => {
        onSend(text.trim(), attachments.length > 0 ? attachments : undefined);
        setText('');
        setAttachments([]);
        setPreviews(prev => {
            prev.forEach(p => URL.revokeObjectURL(p.url));
            return [];
        });
        if (draftStorageKey) localStorage.removeItem(draftStorageKey);
        adjustHeight(true);
    }, 150);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => {
        const newPreviews = prev.filter((_, index) => index !== indexToRemove);
        URL.revokeObjectURL(prev[indexToRemove].url);
        return newPreviews;
    });
  }

  const handleEditImage = (index: number) => {
    const preview = previews[index];
    if (preview.type === 'image' && preview.originalData) {
      setCropperData({ image: preview.originalData, index });
    }
  }

  const onCropComplete = (croppedBase64: string) => {
    if (cropperData) {
      const idx = cropperData.index;
      const parts = croppedBase64.split(',');
      const pureBase64 = parts.length > 1 ? parts[1] : parts[0];
      
      setAttachments(prev => {
        const newArr = [...prev];
        newArr[idx] = { ...newArr[idx], inlineData: { ...newArr[idx].inlineData!, data: pureBase64 } };
        return newArr;
      });

      setPreviews(prev => {
        const newArr = [...prev];
        const oldUrl = newArr[idx].url;
        URL.revokeObjectURL(oldUrl);
        
        // Convert base64 to Blob for preview URL
        const byteString = atob(pureBase64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/jpeg' });
        
        newArr[idx] = { ...newArr[idx], url: URL.createObjectURL(blob), originalData: croppedBase64 };
        return newArr;
      });
    }
    setCropperData(null);
  }
  
  const ChatModeIcon = useCallback(() => {
    const isSpecialMode = chatMode !== 'standard';
    const iconProps = { className: `h-5 w-5 transition-colors ${isSpecialMode ? 'text-white' : 'text-subtle dark:text-dark-subtle'}` };
    switch (chatMode) {
      case 'standard': return <SparkleIcon {...iconProps} />;
      case 'fast': return <FastIcon {...iconProps} />;
      case 'deep': return <DeepIcon {...iconProps} />;
      case 'research': return <ResearchIcon {...iconProps} />;
      case 'maps': return <EarthIcon {...iconProps} />;
      default: return <SparkleIcon {...iconProps} />;
    }
  }, [chatMode]);

  const modes: { id: ChatMode; name: string; description: string; icon: React.ReactElement<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'standard', name: 'ستاندارد', description: 'خێرا و هاوسەنگ', icon: <StandardIcon /> },
    { id: 'fast', name: 'خێرا', description: 'وەڵامی یەکجار خێرا', icon: <FastIcon /> },
    { id: 'deep', name: 'قووڵ', description: 'بۆ بابەتە ئاڵۆزەکان', icon: <DeepIcon /> },
    { id: 'research', name: 'توێژینەوە', description: 'گەڕان لە گۆگڵ', icon: <ResearchIcon /> },
    { id: 'maps', name: 'نەخشە', description: 'زانیاری شوێن', icon: <EarthIcon /> },
  ];
  
  const canSend = !isLoading && (!!text.trim() || attachments.length > 0) && !isRecording;

  return (
    <div className="w-full relative isolate" ref={containerRef}>
        
        {/* Attachment Menu */}
        {isAttachmentMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-4 mx-1 z-30 animate-scale-in origin-bottom-left">
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-[32px] p-3 shadow-xl border border-white/20 flex items-center justify-around gap-2">
                    <button onClick={() => handleAttachmentClick('camera')} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-white/20 transition-all group w-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><CameraIcon className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium opacity-80">Camera</span>
                    </button>
                    <button onClick={() => handleAttachmentClick('gallery')} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-white/20 transition-all group w-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><ImageIcon className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium opacity-80">Photo</span>
                    </button>
                    <button onClick={() => handleAttachmentClick('video')} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-white/20 transition-all group w-full">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><VideoIcon className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium opacity-80">Video</span>
                    </button>
                     <button onClick={() => handleAttachmentClick('audio')} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-white/20 transition-all group w-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><AudioFileIcon className="h-5 w-5" /></div>
                        <span className="text-[10px] font-medium opacity-80">Audio</span>
                    </button>
                </div>
            </div>
        )}

        {/* Previews */}
        {previews.length > 0 && (
            <div className="absolute bottom-full mb-3 left-0 w-full animate-slide-up">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-2">
                  {previews.map((preview, index) => (
                    <div key={preview.url} className="relative w-14 h-14 flex-shrink-0 group rounded-2xl overflow-hidden shadow-lg border border-white/20 cursor-pointer" onClick={() => preview.type === 'image' && handleEditImage(index)}>
                      {preview.type === 'image' ? (
                          <img src={preview.url} alt="preview" className="object-cover w-full h-full" />
                      ) : (
                          <div className="w-full h-full bg-indigo-500/20 backdrop-blur-md flex items-center justify-center">
                              {preview.type === 'video' ? <VideoIcon className="w-6 h-6 text-white" /> : <AudioFileIcon className="w-6 h-6 text-white" />}
                          </div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeAttachment(index); }} className="absolute top-0 right-0 p-0.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <CloseIcon className="w-4 h-4 text-white"/>
                      </button>
                      {preview.type === 'image' && (
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span className="text-[9px] text-white font-bold bg-black/50 px-1.5 py-0.5 rounded-full">Edit</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                   {previews.every(p => p.type === 'image') && (
                      <button 
                          onClick={handleGenerateCaption} 
                          disabled={isCaptioning || isLoading} 
                          className={cn(
                              "w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-[10px] transition-all shadow-lg overflow-hidden relative",
                              !isCaptioning && "bg-[#F0F2F5]/80 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 text-black dark:text-white hover:bg-white/50 dark:hover:bg-white/10",
                          )}
                      >
                           {isCaptioning ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-300 via-purple-300 to-pink-300 animate-pulse" />
                                <div className="relative z-10 flex flex-col items-center justify-center text-black font-bold">
                                    <div className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin mb-0.5"></div>
                                    <span className="font-bold">Scan</span>
                                </div>
                            </>
                           ) : (
                            <>
                                <SparkleIcon className="w-5 h-5 mb-0.5" />
                                <span>Scan</span>
                            </>
                           )}
                      </button>
                  )}
                </div>
            </div>
        )}

        {/* Loading Spinner Background */}
        {isLoading && (
            <div className="absolute -inset-[2px] rounded-[34px] z-0 overflow-hidden">
                <div className="absolute inset-[-100%] animate-[spin_1.5s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,#3b82f6_0%,#a855f7_50%,#3b82f6_100%)] opacity-70 blur-md" />
            </div>
        )}

        {/* Input Bar Main */}
        <div className={cn("relative z-10 w-full rounded-[32px] transition-all duration-300 bg-[#F0F2F5]/80 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-lg", isFocused && !isLoading && "shadow-[0_0_20px_rgba(37,99,235,0.3)] border-white/60", isLoading && "border-transparent animate-pulse-glow")}>   
            <div className="relative flex items-end gap-1 p-1.5">
                <div className="flex-shrink-0 mb-0.5 ml-0.5" ref={attachmentMenuRef}>
                    <button onClick={() => setIsAttachmentMenuOpen(prev => !prev)} className={cn("w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300", isAttachmentMenuOpen ? "bg-black text-white dark:bg-white dark:text-black rotate-45 shadow-lg" : "text-subtle dark:text-dark-subtle hover:bg-black/5 dark:hover:bg-white/10")} disabled={isLoading}><PlusIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 min-w-0 relative">
                     <Textarea 
                        ref={textareaRef} 
                        id="ai-input" 
                        dir="auto" 
                        placeholder={isRecording ? 'Listening...' : "Ask Zana..."} 
                        className={cn(
                            "w-full bg-transparent border-none focus-visible:ring-0 focus-visible:outline-none resize-none px-2 py-3.5 !text-primary dark:!text-dark-primary min-h-[52px] max-h-[200px]",
                            isLargeText ? "text-xl leading-relaxed" : "text-base"
                        )} 
                        value={text} 
                        onChange={handleTextChange} 
                        onKeyDown={handleKeyPress} 
                        onFocus={() => setIsFocused(true)} 
                        onBlur={() => setIsFocused(false)} 
                        disabled={submitted || isRecording} 
                        rows={1} 
                     />
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 mb-0.5 mr-0.5">
                    <div className="relative" ref={modeSelectorRef}>
                        <button onClick={() => setIsModeSelectorOpen(prev => !prev)} className={cn("w-10 h-10 flex items-center justify-center rounded-full transition-all", chatMode !== 'standard' ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "text-subtle dark:text-dark-subtle hover:bg-black/5 dark:hover:bg-white/10")} disabled={isLoading}><ChatModeIcon /></button>
                         <div className={`absolute bottom-full rtl:left-0 ltr:right-0 mb-3 w-48 bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-2xl shadow-2xl p-1.5 z-30 transition-all origin-bottom flex flex-col gap-1 ${isModeSelectorOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            {modes.map((mode) => (
                                <button key={mode.id} onClick={() => { onChatModeChange(mode.id); setIsModeSelectorOpen(false);}} className={`group flex items-center justify-between w-full p-2 rounded-xl transition-all ${chatMode === mode.id ? 'bg-white dark:bg-white/10 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                    <div className="flex flex-col items-start min-w-0 pr-1"><span className={`text-sm font-bold ${chatMode === mode.id ? 'text-black dark:text-white' : 'text-primary'}`}>{mode.name}</span><span className="text-[9px] text-muted truncate max-w-[80px]">{mode.description}</span></div>
                                    <div className={`p-1.5 rounded-lg ${chatMode === mode.id ? 'text-black dark:text-white' : 'text-subtle'}`}>{React.cloneElement(mode.icon, {className: "w-5 h-5"})}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    {!text && !attachments.length && !isRecording ? (
                          <button onClick={toggleRecording} className="w-10 h-10 flex items-center justify-center rounded-full text-subtle dark:text-dark-subtle hover:bg-black/5" disabled={isLoading}><MicIcon className="w-6 h-6" /></button>
                       ) : isRecording ? (
                           <button onClick={stopRecording} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white animate-pulse shadow-md"><StopIcon className="w-5 h-5" /></button>
                       ) : (
                          <button onClick={handleSend} className={cn("w-10 h-10 flex items-center justify-center rounded-full shadow-md", submitted ? "bg-transparent scale-90" : "bg-black dark:bg-white")} disabled={submitted || !canSend}>
                              {submitted ? <div className="w-5 h-5 bg-black dark:bg-white rounded-sm animate-spin" /> : <CornerRightUpIcon className={cn("w-5 h-5 text-white dark:text-black -scale-x-100", canSend ? "opacity-100" : "opacity-50")} />}
                          </button>
                       )}
                </div>
            </div>
        </div>
       {permissionPrimer.isOpen && <PermissionPrimer isOpen={permissionPrimer.isOpen} permission={permissionPrimer.type!} onAllow={permissionPrimer.onAllow} onClose={() => setPermissionPrimer(p => ({ ...p, isOpen: false }))} isDenied={permissionPrimer.isDenied} />}
       
       {/* Image Cropper Modal */}
       {cropperData && (
          <ImageCropper 
            image={cropperData.image} 
            onClose={() => setCropperData(null)} 
            onCrop={onCropComplete} 
          />
       )}
    </div>
  );
};

const CloseIcon = ({className}:{className?:string}) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

export default InputBar;
