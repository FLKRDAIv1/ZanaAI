
import React, { useState, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, User, MoreHorizontal, Speaker, RefreshCw, X, Download } from 'lucide-react';
import { ZanaIcon } from './icons/ZanaIcon';
import type { Message } from '../types';
import GraphTool from './GraphTool';

const loadingPhrases = [
  "بەمزوانە وەڵامت دەدەمەوە...",
  "تکایە چاوەڕێ بکە...",
  "ڕاوە با بیر بکەمەوە...",
  "وابزانم بەبیرم هات...",
  "ببورە ئەوەی داوات کرد ڕەتی دەکەمەوە... یان ڕاوەستە ئێستا بەبیرم هات...",
  "ههمم ڕاوە...",
  "چاوەڕێ بکە بۆ وەڵامدانەوە..."
];

const highlightCode = (code: string) => {
  const controlFlow = /\b(if|else|return|for|while|do|switch|case|break|continue|try|catch|finally|throw)\b/g; 
  const numbers = /\b\d+(\.\d+)?\b/g;
  const typesAndDeclarations = /\b(const|let|var|function|class|interface|type|import|from|export|default|async|await|extends|implements|public|private|protected|string|number|boolean|any|object)\b/g; 
  const strings = /(['"`])(.*?)\1/g; 
  const comments = /(\/\/.*$)/gm;

  let highlighted = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  highlighted = highlighted.replace(strings, '<span class="text-green-400">$1$2$1</span>');
  highlighted = highlighted.replace(comments, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(controlFlow, '<span class="text-purple-400 font-bold">$1</span>');
  highlighted = highlighted.replace(numbers, '<span class="text-green-400 font-bold">$&</span>');
  highlighted = highlighted.replace(typesAndDeclarations, '<span class="text-yellow-300 font-semibold">$1</span>');
  return highlighted;
};

const CodeTerminal: React.FC<{ code: string; language: string; isLargeText?: boolean }> = ({ code, language, isLargeText }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (language === 'graph') {
    try {
      const data = JSON.parse(code);
      return <GraphTool data={data} isLargeText={isLargeText} />;
    } catch (e) {
      return <div className="p-2 border border-red-500 rounded text-xs">Failed to render graph</div>;
    }
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden bg-[#1a1b26] shadow-2xl border border-slate-800/50 group w-full dir-ltr text-left" dir="ltr">
      <div className="flex items-center justify-between px-4 py-2 bg-[#16161e] border-b border-slate-800/50">
        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/80" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/80" /></div>
        <div className="text-[10px] font-mono text-slate-400 font-medium uppercase tracking-wider">{language || 'CODE'}</div>
        <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-300">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
        </pre>
      </div>
    </div>
  );
};

const ContextMenuOverlay = ({ onClose, onCopy, onSpeak, onRetry, ttsStatus }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-2 w-64 ring-1 ring-black/5 dark:ring-white/10 animate-scale-in" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ئامرازەکان</span>
        <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
      </div>
      <button onClick={() => { onCopy(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-right">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Copy size={18} /></div>
        <span className="font-medium text-slate-700 dark:text-slate-200">کۆپیکردن</span>
      </button>
      <button onClick={() => { onSpeak(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-right">
        <div className={`p-2 rounded-lg ${ttsStatus === 'PLAYING' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}><Speaker size={18} /></div>
        <span className="font-medium text-slate-700 dark:text-slate-200">{ttsStatus === 'PLAYING' ? 'وەستاندنی دەنگ' : 'خوێندنەوە'}</span>
      </button>
      {onRetry && (
        <button onClick={() => { onRetry(); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-right">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><RefreshCw size={18} /></div>
          <span className="font-medium text-slate-700 dark:text-slate-200">دووبارە دروستکردنەوە</span>
        </button>
      )}
    </div>
  </div>
);

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  onRetry?: () => void;
  ttsStatus?: 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR';
  onSpeechAction?: () => void;
  onStopSpeech?: () => void;
  isLargeText?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLastMessage, onRetry, ttsStatus, onSpeechAction, onStopSpeech, isLargeText }) => {
  const isUser = message.role === 'user';
  const [showContextMenu, setShowContextMenu] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); setShowContextMenu(true); };
  const handleTouchStart = () => { touchTimer.current = setTimeout(() => { setShowContextMenu(true); }, 600); };
  const cancelTouch = () => { if (touchTimer.current) { clearTimeout(touchTimer.current); touchTimer.current = null; } };

  const handleCopy = () => navigator.clipboard.writeText(message.text);
  const handleSpeakToggle = () => { if (ttsStatus === 'PLAYING' && onStopSpeech) onStopSpeech(); else if (onSpeechAction) onSpeechAction(); };

  const loadingText = useMemo(() => {
    if (!message.id) return loadingPhrases[0];
    let hash = 0;
    for (let i = 0; i < message.id.length; i++) hash = message.id.charCodeAt(i) + ((hash << 5) - hash);
    return loadingPhrases[Math.abs(hash) % loadingPhrases.length];
  }, [message.id]);

  const handleDownloadImage = (data: string, mimeType: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${data}`;
    link.download = `zana-image-${Date.now()}.${mimeType.split('/')[1] || 'png'}`;
    link.click();
  };

  return (
    <>
    <div className={`w-full flex gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up group/bubble mb-4`} dir="rtl">
      <div className="flex-shrink-0 flex flex-col items-center">
        {isUser ? (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-white dark:from-slate-700 dark:to-slate-600 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
            <User size={isLargeText ? 24 : 18} className="text-slate-500 dark:text-slate-300" />
          </div>
        ) : (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full p-[1px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden"><ZanaIcon className="w-full h-full object-cover" /></div>
          </div>
        )}
      </div>

      <div className={`flex flex-col min-w-0 max-w-[85%] md:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <span className={`font-bold tracking-wider text-slate-400 mb-1 px-1 ${isLargeText ? 'text-[12px] md:text-[14px]' : 'text-[10px] md:text-[11px]'}`}>{isUser ? 'تۆ' : 'زانا AI'}</span>
        
        {/* Attachments rendering */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.attachments.map((part, idx) => {
              if (part.inlineData) {
                const isImage = part.inlineData.mimeType.startsWith('image/');
                if (isImage) {
                  return (
                    <div key={idx} className="relative group/img overflow-hidden rounded-[10px] shadow-sm border border-black/5 dark:border-white/10 bg-overlay/50 dark:bg-dark-overlay/50">
                      <img 
                        src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                        alt="Attachment" 
                        className="max-w-[240px] md:max-w-[320px] max-h-[400px] object-contain rounded-[10px]"
                      />
                      <button 
                        onClick={() => handleDownloadImage(part.inlineData!.data, part.inlineData!.mimeType)}
                        className="absolute top-2 left-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-md"
                        title="Save Image"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  );
                }
              }
              return null;
            })}
          </div>
        )}

        <div 
          className={`relative px-4 py-3 md:px-5 md:py-4 overflow-hidden ${isUser ? 'bg-white dark:bg-slate-800 rounded-2xl rounded-tr-sm text-black dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700' : 'bg-transparent text-black dark:text-slate-100 w-full selection:bg-purple-500/30'} ${isLargeText ? 'text-lg md:text-xl' : 'text-sm md:text-base'}`}
          onContextMenu={handleContextMenu} onTouchStart={handleTouchStart} onTouchEnd={cancelTouch} onTouchMove={cancelTouch}
        >
          {message.isLoading && !message.text ? (
             <div className="py-1"><p className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 dark:from-gray-500 dark:via-gray-300 dark:to-gray-500 bg-[length:200%_auto] animate-text-shimmer leading-relaxed">{loadingText}</p></div>
          ) : (
            <div className={`prose dark:prose-invert prose-pre:p-0 prose-pre:bg-transparent max-w-none prose-p:text-black dark:prose-p:text-slate-200 prose-li:text-black dark:prose-li:text-slate-200 prose-headings:text-black dark:prose-headings:text-slate-100 prose-strong:text-black dark:prose-strong:text-white ${isLargeText ? 'prose-p:text-lg prose-p:leading-loose prose-li:text-lg' : 'prose-p:leading-relaxed'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeContent = String(children).replace(/\n$/, '');
                    return <CodeTerminal code={codeContent} language={match ? match[1] : ''} isLargeText={isLargeText} />;
                  },
                  p({children}) { return <p className={`mb-4 last:mb-0 text-black dark:text-slate-200 ${isLargeText ? 'text-xl leading-relaxed' : ''}`}>{children}</p> },
                  li({children}) { return <li className={`text-black dark:text-slate-200 ${isLargeText ? 'text-xl mb-2' : ''}`}>{children}</li> },
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/50 w-full">
              <p className={`font-bold text-slate-400 mb-2 uppercase tracking-widest ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>سەرچاوەکان</p>
              <div className="flex flex-wrap gap-2">{message.sources.map((source, i) => (<a key={i} href={source.uri} target="_blank" className="flex items-center gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-blue-500 hover:underline truncate max-w-[200px]"><span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />{source.title}</a>))}</div>
            </div>
          )}
        </div>

        {!isUser && !message.isLoading && (
          <div className="flex items-center gap-1 mt-1 px-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-300 md:flex hidden">
             <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="کۆپیکردن"><Copy size={14} /></button>
             {onSpeechAction && (
                <button onClick={handleSpeakToggle} className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${ttsStatus === 'PLAYING' ? 'text-indigo-500 animate-pulse' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>{ttsStatus === 'PLAYING' ? <div className="w-3 h-3 bg-current rounded-sm"/> : <Speaker size={14} />}</button>
             )}
              <button onClick={(e) => { e.preventDefault(); setShowContextMenu(true); }} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="زیاتر"><MoreHorizontal size={14} /></button>
          </div>
        )}
      </div>
    </div>
    {showContextMenu && <ContextMenuOverlay onClose={() => setShowContextMenu(false)} onCopy={handleCopy} onSpeak={handleSpeakToggle} onRetry={onRetry} ttsStatus={ttsStatus} />}
    </>
  );
};

export default MessageBubble;
