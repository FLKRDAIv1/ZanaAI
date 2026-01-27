
import React, { useState, useEffect } from 'react';
import type { Theme } from '../App';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { CloseIcon } from './icons/CloseIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { BellIcon } from './icons/BellIcon';
import { EyeIcon } from 'lucide-react';
import { cn } from '../lib/utils';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isLargeText: boolean;
  setIsLargeText: (val: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  isLargeText,
  setIsLargeText
}) => {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);


  if (!isOpen) return null;
  
  const handleRequestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
        });
    }
  };

  return (
    <>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
        <div className="relative z-50 w-full max-w-sm animate-scale-in rounded-2xl border border-white/20 bg-white/70 p-6 text-primary shadow-2xl backdrop-blur-lg dark:border-black/20 dark:bg-black/50 dark:text-dark-primary">
          <div className="flex items-center justify-between mb-6">
            <h2 id="settings-modal-title" className="text-xl font-bold">ڕێکخستنەکان</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Close settings">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Theme Switcher */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-subtle dark:text-dark-subtle">شێواز</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-black/5 p-1 dark:bg-white/5">
                <button onClick={() => onThemeChange('light')} className={`flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-semibold transition active:scale-95 ${currentTheme === 'light' ? 'bg-white text-primary shadow-sm dark:bg-dark-surface dark:text-dark-primary' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <SunIcon className="w-5 h-5" />
                    <span>ڕووناک</span>
                </button>
                <button onClick={() => onThemeChange('dark')} className={`flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-semibold transition active:scale-95 ${currentTheme === 'dark' ? 'bg-white text-primary shadow-sm dark:bg-dark-surface dark:text-dark-primary' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <MoonIcon className="w-5 h-5" />
                    <span>تاریک</span>
                </button>
                </div>
            </div>

            {/* Accessibility Section */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-subtle dark:text-dark-subtle">ئاڕاستەکردنی بینین (Accessibility)</label>
                <button 
                    onClick={() => setIsLargeText(!isLargeText)}
                    className="flex items-center justify-between w-full rounded-lg py-3 px-4 text-sm font-semibold transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                >
                    <div className="flex items-center space-x-2">
                        <EyeIcon size={20} className="ml-2" />
                        <span>تێکستی گەورە (Farsightedness)</span>
                    </div>
                    {/* Toggle Switch - Position adjusted for RTL layout */}
                    <div className={cn(
                        "w-10 h-6 rounded-full p-1 transition-colors duration-200 flex items-center shadow-inner",
                        isLargeText ? "bg-blue-500 justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                    )}>
                        <div className="w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-md" />
                    </div>
                </button>
            </div>
            
            {/* Notification Settings */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-subtle dark:text-dark-subtle">ئاگادارکردنەوەکان</label>
                <button onClick={handleRequestNotificationPermission} disabled={notificationPermission !== 'default'} className={`flex items-center justify-between w-full space-x-2 rounded-lg py-3 px-4 text-sm font-semibold transition-colors bg-black/5 dark:bg-white/5 ${notificationPermission === 'default' ? 'hover:bg-black/10 dark:hover:bg-white/10' : 'cursor-default'}`}>
                    <div className="flex items-center space-x-2">
                        <BellIcon className="w-5 h-5 ml-2" />
                        <span>کاراکردنی ئاگادارکردنەوەکان</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${notificationPermission === 'granted' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : notificationPermission === 'denied' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-200 text-gray-700 dark:bg-dark-overlay dark:text-dark-subtle'}`}>
                        {notificationPermission === 'granted' ? 'کاراکراوە' : notificationPermission === 'denied' ? 'بلۆک کراوە' : 'داواکردن'}
                    </span>
                </button>
            </div>
          </div>
          
          <div className="mt-6">
              <button onClick={() => setIsPrivacyModalOpen(true)} className="flex items-center w-full justify-center space-x-2 rounded-lg py-3 text-sm font-semibold transition-colors bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
                  <ShieldCheckIcon className="w-5 h-5 ml-2" />
                  <span>Privacy & Terms</span>
              </button>
          </div>

          <div className="mt-8 pt-4 border-t border-black/10 dark:border-white/10 text-center text-xs text-muted dark:text-dark-muted">
            <p>Created by Zana Faroq</p>
            <p className="mt-1">Powered by flkrd.studio</p>
          </div>
        </div>
      </div>
      <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} isInformational={true} />
    </>
  );
};

export default SettingsModal;
