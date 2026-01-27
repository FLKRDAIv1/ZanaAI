
import React from 'react';
import { TrashIcon } from './icons/TrashIcon';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative z-[110] w-full max-w-[320px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl rounded-[24px] shadow-2xl overflow-hidden animate-scale-in border border-white/20 dark:border-white/5">
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <TrashIcon className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-primary dark:text-dark-primary mb-2">سڕینەوەی گفتوگۆ؟</h3>
          <p className="text-sm text-subtle dark:text-dark-subtle leading-relaxed">
            ئایا دڵنیایت لە سڕینەوەی <span className="font-semibold text-primary dark:text-dark-primary">"{title}"</span>؟ ئەم کارە ناگەڕێتەوە.
          </p>
        </div>
        
        <div className="flex flex-col border-t border-black/5 dark:border-white/5">
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="w-full py-4 text-[17px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors active:opacity-70"
          >
            سڕینەوە
          </button>
          <div className="h-px bg-black/5 dark:border-white/5" />
          <button 
            onClick={onClose}
            className="w-full py-4 text-[17px] font-medium text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:opacity-70"
          >
            پاشگەزبوونەوە
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
