
import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession } from '../types';
import { EditIcon } from './icons/EditIcon';
import { CloseIcon } from './icons/CloseIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameSession: (chatId: string, newTitle: string) => void;
  onDeleteSession: (chatId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameSession,
  onDeleteSession
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSessionId]);

  const handleStartEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setRenameValue(session.title);
  };

  const handleCancelEditing = () => {
    setEditingSessionId(null);
    setRenameValue('');
  };

  const handleSaveRename = () => {
    if (editingSessionId && renameValue.trim()) {
      onRenameSession(editingSessionId, renameValue.trim());
    }
    setEditingSessionId(null);
    setRenameValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };
  
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteSession(id);
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:relative inset-y-0 right-0 z-50 md:z-auto w-72 
          bg-base dark:bg-dark-base border-l border-overlay dark:border-dark-overlay
          transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
           <div className="flex items-center space-x-2">
               <div className="w-8 h-8 rounded-lg bg-primary dark:bg-dark-primary flex items-center justify-center text-base dark:text-dark-base font-bold shadow-sm">Z</div>
               <span className="font-bold text-lg tracking-tight">Zana AI</span>
           </div>
           <button onClick={onClose} className="p-2 rounded-lg hover:bg-overlay dark:hover:bg-dark-overlay md:hidden text-subtle">
              <CloseIcon className="w-5 h-5" />
           </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4">
            <button 
                onClick={onNewChat} 
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary dark:bg-dark-primary text-base dark:text-dark-base rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] font-semibold text-sm"
            >
              <EditIcon className="w-4 h-4" />
              <span>گفتوگۆی نوێ</span>
            </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-bold text-muted dark:text-dark-muted uppercase tracking-[0.1em] text-right opacity-60">
                مێژووی دوایی
            </div>
            {sessions.map(session => (
              <div
                key={session.id}
                className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                  session.id === activeChatId 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' 
                    : 'text-subtle dark:text-dark-subtle hover:bg-overlay/60 dark:hover:bg-dark-overlay/60 hover:text-primary dark:hover:text-dark-primary'
                }`}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center w-full p-2 animate-fadeIn">
                    <input
                      ref={inputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handleSaveRename}
                      className="flex-1 bg-white dark:bg-[#1c1c1e] border-2 border-blue-500 rounded-lg px-2.5 py-1.5 text-sm outline-none text-right font-medium text-primary dark:text-white shadow-inner"
                      dir="auto"
                    />
                  </div>
                ) : (
                  <div className="relative flex-1 flex items-center w-full">
                    <button
                      onClick={() => onSelectChat(session.id)}
                      className="flex-1 flex items-center w-full p-3 text-right text-sm truncate rounded-xl"
                    >
                      <span className="truncate flex-1">{session.title}</span>
                    </button>
                    
                    {/* Actions - Always visible for active, visible on hover for others */}
                    <div className={`
                        absolute left-2 flex items-center space-x-1 bg-gradient-to-r from-transparent via-inherit to-inherit pl-4
                        transition-opacity duration-200
                        ${session.id === activeChatId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}>
                        <button 
                          onClick={(e) => handleStartEditing(session, e)} 
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-subtle"
                          title="Rename"
                        >
                            <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(session.id, e)} 
                          className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-subtle"
                          title="Delete"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 text-[10px] text-muted dark:text-dark-muted text-center font-medium opacity-50">
            <p>&copy; 2025 ZANA AI SYSTEM</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
