
import React from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { MicIcon } from './icons/MicIcon';
import { CloseIcon } from './icons/CloseIcon';
import { InfoIcon } from './icons/InfoIcon';
import { BellIcon } from './icons/BellIcon';

interface PermissionPrimerProps {
  isOpen: boolean;
  permission: 'camera' | 'microphone' | 'notification';
  onAllow: () => void;
  onClose: () => void;
  isDenied: boolean;
}

const permissionDetails = {
  camera: {
    icon: <CameraIcon className="w-10 h-10 text-primary dark:text-dark-primary" />,
    title: {
      en: "Allow Zana AI to Access Your Camera?",
      ku: "ڕێگە بە زانا AI دەدەیت دەستی بە کامێراکەت بگات؟"
    },
    description: {
      en: "This lets you take and send photos directly in your chat. For example, you can snap a picture of a landmark to ask about its history.",
      ku: "ئەمە ڕێگەت پێدەدات ڕاستەوخۆ وێنە بگریت و لە چاتدا بینێریت. بۆ نموونە، دەتوانیت وێنەی شوێنەوارێک بگریت بۆ ئەوەی دەربارەی مێژووەکەی بپرسیت."
    },
    denied: {
        en: "Camera access is currently blocked. To use this feature, please enable camera permissions for this site in your browser's settings.",
        ku: "دەستگەیشتن بە کامێرا لە ئێستادا بلۆک کراوە. بۆ بەکارهێنانی ئەم تایبەتمەندییە، تکایە لە ڕێکخستنەکانی وێبگەڕەکەتدا ڕێگە بە کامێرا بدە بۆ ئەم سایتە."
    }
  },
  microphone: {
    icon: <MicIcon className="w-10 h-10 text-primary dark:text-dark-primary" />,
    title: {
      en: "Allow Zana AI to Access Your Microphone?",
      ku: "ڕێگە بە زانا AI دەدەیت دەستی بە مایکرۆفۆنەکەت بگات؟"
    },
    description: {
      en: "This lets you talk to Zana AI instead of typing. For example, press the mic button to ask your question out loud.",
      ku: "ئەمە ڕێگەت پێدەدات لەبری نووسین قسە لەگەڵ زانا AI بکەیت. بۆ نموونە، دوگمەی مایکرۆفۆنەکە دابگرە بۆ ئەوەی پرسیارەکەت بە دەنگی بەرز بکەیت."
    },
    denied: {
        en: "Microphone access is currently blocked. To use this feature, please enable microphone permissions for this site in your browser's settings.",
        ku: "دەستگەیشتن بە مایکرۆفۆن لە ئێستادا بلۆک کراوە. بۆ بەکارهێنانی ئەم تایبەتمەندییە، تکایە لە ڕێکخستنەکانی وێبگەڕەکەتدا ڕێگە بە مایکرۆفۆن بدە بۆ ئەم سایتە."
    }
  },
  notification: {
    icon: <BellIcon className="w-10 h-10 text-primary dark:text-dark-primary" />,
    title: {
      en: "Enable Notifications?",
      ku: "ئاگادارکردنەوەکان کارا بکەیت؟"
    },
    description: {
      en: "Get notified when Zana AI replies to your messages, even when the app is in the background.",
      ku: "ئاگاداربکرێیتەوە کاتێک زانا AI وەڵامت دەداتەوە، تەنانەت کاتێک ئەپەکە لە پاشبنەمادایە."
    },
    denied: {
        en: "Notifications are currently blocked. To get alerts, please enable notification permissions for this site in your browser's settings.",
        ku: "ئاگادارکردنەوەکان لە ئێستادا بلۆک کراون. بۆ وەرگرتنی ئاگادارکردنەوە، تکایە لە ڕێکخستنەکانی وێبگەڕەکەتدا ڕێگە بە ئاگادارکردنەوە بدە بۆ ئەم سایتە."
    }
  }
};

const PermissionPrimer: React.FC<PermissionPrimerProps> = ({ isOpen, permission, onAllow, onClose, isDenied }) => {
  if (!isOpen) return null;

  const details = permissionDetails[permission];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-sm animate-scale-in rounded-2xl bg-surface dark:bg-dark-surface p-6 text-primary dark:text-dark-primary shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-overlay dark:bg-dark-overlay">
          {details.icon}
        </div>
        
        <h2 id="permission-modal-title" className="text-lg font-bold">
          {details.title.ku}
        </h2>
        <p className="text-sm text-subtle dark:text-dark-subtle mt-1 mb-4">{details.title.en}</p>

        {isDenied ? (
            <div className="my-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex items-start text-left text-sm">
                <InfoIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                    <p>{details.denied.ku}</p>
                    <p className="mt-1 opacity-80">{details.denied.en}</p>
                </div>
            </div>
        ) : (
            <>
                <p className="text-sm mb-1">{details.description.ku}</p>
                <p className="text-xs text-muted dark:text-dark-muted mb-6">{details.description.en}</p>
            </>
        )}
        
        <div className="flex flex-col space-y-3">
          {!isDenied && (
            <button
                onClick={onAllow}
                className="w-full px-4 py-3 bg-highlight text-white font-semibold rounded-full shadow-lg hover:bg-opacity-90 transition-transform transform btn-premium-glow"
            >
                ڕێگەپێدان (Allow)
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-overlay dark:bg-dark-overlay font-semibold rounded-full hover:bg-opacity-80"
          >
            {isDenied ? 'باشە (Got it)' : 'ڕێگەپێنەدان (Don\'t Allow)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionPrimer;