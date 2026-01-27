



import React, { useState } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { MicIcon } from './icons/MicIcon';
import { ZanaIcon } from './icons/ZanaIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { TelegramIcon } from './icons/TelegramIcon';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAgree?: () => void;
  isInformational: boolean;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose, onAgree, isInformational }) => {
  const [lang, setLang] = useState<'ku' | 'en'>('ku');

  if (!isOpen) return null;

  const content = {
    ku: {
      title: "پاراستنی زانیاری و بەکارهێنان",
      intro: "بۆ پێشکەشکردنی ئەزموونێکی دەوڵەمەند و کارلێککارانە، زانا AI داوای دەستگەیشتن بە هەندێک تایبەتمەندی ئامێرەکەت دەکات. پاراستنی زانیارییەکانت بۆ ئێمە گرنگە، و ئێمە تەنها کاتێک داوای مۆڵەت دەکەین کە پێویست بێت بۆ کارپێکردنی ئەو تایبەتمەندیانەی کە تۆ هەڵیدەبژێریت بەکاریبهێنیت.",
      cameraTitle: "دەستگەیشتن بە کامێرا",
      cameraWhy: "بۆچی داوای دەکەین؟",
      cameraWhyDesc: "بۆ ناردنی وێنە و ڤیدیۆ لە چاتدا، یان بۆ دەستپێکردنی گەڕانی بینراو.",
      cameraHow: "چۆن بەکاردێت (نموونە):",
      cameraHowDesc: "بۆ نموونە، وێنەی شوێنەوارێک بگرە بۆ ئەوەی دەربارەی بپرسیت، یان وێنەیەک بنێرە بۆ وەرگرتنی بیرۆکەی نوێ.",
      micTitle: "دەستگەیشتن بە مایکرۆفۆن",
      micWhy: "بۆچی داوای دەکەین؟",
      micWhyDesc: "بۆ بەکارهێنانی فەرمانی دەنگی لەبری نووسین.",
      micHow: "چۆن بەکاردێت (نموونە):",
      micHowDesc: "بۆ نموونە، کرتە لە دوگمەی مایکرۆفۆنەکە بکە و بڵێ، \"کەش و هەوا ئەمڕۆ چۆنە؟\"",
      agreement: "بە کرتەکردن لە \"ڕازیبوون و بەردەوامبوون،\" تۆ پشتڕاستی دەکەیتەوە کە ئەم مەرجانەت خوێندووەتەوە و لێیان تێگەیشتوویت.",
      agreeButton: "ڕازیبوون و بەردەوامبوون",
      closeButton: "داخستن",
      disclaimerTitle: "ئاگانامە و پەیوەندی",
      disclaimerWarningTitle: "تەنها بۆ مەبەستی تاقیکاری",
      disclaimerWarningDesc: "ئەم ئەپڵیکەیشنە بۆ مەبەستی پیشاندان و بەکارهێنانی ناوخۆیی دروستکراوە. بۆ بڵاوکردنەوەی گشتی یان بەکارهێنانی بازرگانی نییە.",
      disclaimerResponsibilityTitle: "بەرپرسیارێتی گەشەپێدەر",
      disclaimerResponsibilityDesc: "گەشەپێدەر، زانا فاروق، بەرپرسیارە لە هەر کێشەیەکی تەکنیکی یان دزەپێکردنی داتای پەیوەست بەم ئەپەوە.",
      disclaimerFeedbackTitle: "پەیوەندی و پێشنیار",
      disclaimerFeedbackDesc: "بۆ هەر کێشەیەک، پرسیارێک، یان پێشنیارێک، تکایە لە ڕێگەی تێلیگرامەوە پەیوەندیمان پێوە بکەن. ئێمە بە گەرمی پێشوازی لە بۆچوونەکانتان دەکەین.",
      telegramButton: "پەیوەندی بکە لە تێلیگرام",
      qrAlt: "کۆدی QR بۆ تێلیگرامی FLKRD STUDIO",
    },
    en: {
      title: "Privacy & Data Usage",
      intro: "To provide a rich, interactive experience, Zana AI requests access to certain features on your device. Your privacy is important to us, and we only ask for permissions when necessary to enable specific functionalities you choose to use.",
      cameraTitle: "Camera Access",
      cameraWhy: "Why we ask:",
      cameraWhyDesc: "To send photos and videos in chat, or to start a visual search.",
      cameraHow: "How it's used (Example):",
      cameraHowDesc: "For example, snap a picture of a landmark to ask about it, or send an image to get creative ideas.",
      micTitle: "Microphone Access",
      micWhy: "Why we ask:",
      micWhyDesc: "To use your voice for hands-free commands instead of typing.",
      micHow: "How it's used (Example):",
      micHowDesc: "For example, tap the microphone button and ask, \"What's the weather like today?\"",
      agreement: "By clicking \"Agree and Continue,\" you acknowledge that you have read and understood these terms.",
      agreeButton: "Agree and Continue",
      closeButton: "Close",
      disclaimerTitle: "Disclaimer & Contact",
      disclaimerWarningTitle: "For Demonstrative Purposes Only",
      disclaimerWarningDesc: "This application is created for demonstration and local use. It is not intended for public distribution or commercial purposes.",
      disclaimerResponsibilityTitle: "Developer Responsibility",
      disclaimerResponsibilityDesc: "The developer, Zana Farooq, is responsible for any technical issues or data leaks related to this application.",
      disclaimerFeedbackTitle: "Feedback & Contact",
      disclaimerFeedbackDesc: "For any issues, questions, or feedback, please contact us via Telegram. We welcome your input.",
      telegramButton: "Contact on Telegram",
      qrAlt: "QR code for FLKRDSTUDIO Telegram",
    }
  };

  const selectedContent = content[lang];
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base dark:bg-dark-base"
    >
      <div className="relative w-full max-w-lg h-full max-h-[90vh] flex flex-col animate-scale-in rounded-2xl bg-surface dark:bg-dark-surface text-primary dark:text-dark-primary shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-overlay dark:border-dark-overlay flex-shrink-0">
          <div className="flex items-center space-x-2">
            <ZanaIcon className="w-8 h-8"/>
            <h2 id="privacy-modal-title" className="text-lg font-bold">{selectedContent.title}</h2>
          </div>
          <div className="flex items-center space-x-2">
              {/* Language Switcher */}
              <div className="text-sm">
                  <button onClick={() => setLang('ku')} className={`px-2 py-1 rounded ${lang === 'ku' ? 'font-bold text-highlight dark:text-dark-highlight' : 'text-subtle'}`}>کوردی</button>
                  <span className="text-muted">|</span>
                  <button onClick={() => setLang('en')} className={`px-2 py-1 rounded ${lang === 'en' ? 'font-bold text-highlight dark:text-dark-highlight' : 'text-subtle'}`}>EN</button>
              </div>
              {isInformational && onClose && (
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-overlay dark:hover:bg-dark-overlay">
                      <CloseIcon className="w-6 h-6" />
                  </button>
              )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-left" dir={lang === 'ku' ? 'rtl' : 'ltr'}>
          <p className="mb-6 text-subtle dark:text-dark-subtle">{selectedContent.intro}</p>

          {/* Camera Section */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0 mt-1" style={lang === 'en' ? {marginRight: '1rem'} : {marginLeft: '1rem'}}>
              <CameraIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{selectedContent.cameraTitle}</h3>
              <p className="font-semibold mt-2">{selectedContent.cameraWhy}</p>
              <p className="text-subtle dark:text-dark-subtle">{selectedContent.cameraWhyDesc}</p>
              <p className="font-semibold mt-2">{selectedContent.cameraHow}</p>
              <p className="text-subtle dark:text-dark-subtle">{selectedContent.cameraHowDesc}</p>
            </div>
          </div>
          
          {/* Microphone Section */}
          <div className="flex items-start space-x-4">
             <div className="flex-shrink-0 mt-1" style={lang === 'en' ? {marginRight: '1rem'} : {marginLeft: '1rem'}}>
              <MicIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">{selectedContent.micTitle}</h3>
              <p className="font-semibold mt-2">{selectedContent.micWhy}</p>
              <p className="text-subtle dark:text-dark-subtle">{selectedContent.micWhyDesc}</p>
              <p className="font-semibold mt-2">{selectedContent.micHow}</p>
              <p className="text-subtle dark:text-dark-subtle">{selectedContent.micHowDesc}</p>
            </div>
          </div>
          
          <div className="my-6 border-t border-overlay dark:border-dark-overlay" />

          {/* Disclaimer & Contact Section */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1" style={lang === 'en' ? {marginRight: '1rem'} : {marginLeft: '1rem'}}>
                <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold">{selectedContent.disclaimerTitle}</h3>
                <p className="font-semibold mt-2">{selectedContent.disclaimerWarningTitle}</p>
                <p className="text-subtle dark:text-dark-subtle">{selectedContent.disclaimerWarningDesc}</p>
                
                <p className="font-semibold mt-2">{selectedContent.disclaimerResponsibilityTitle}</p>
                <p className="text-subtle dark:text-dark-subtle">{selectedContent.disclaimerResponsibilityDesc}</p>
                
                <p className="font-semibold mt-2">{selectedContent.disclaimerFeedbackTitle}</p>
                <p className="text-subtle dark:text-dark-subtle">{selectedContent.disclaimerFeedbackDesc}</p>

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 rounded-lg bg-overlay dark:bg-dark-overlay p-4">
                  <img src="https://i.imgur.com/M3cISYJ.png" alt={selectedContent.qrAlt} className="w-28 h-28 rounded-md flex-shrink-0" />
                  <div className="text-center sm:text-left">
                    <p className="font-semibold">Get in touch</p>
                    <p className="text-xs text-subtle dark:text-dark-subtle mb-3">Scan the QR code or click the button below to open Telegram.</p>
                     <a 
                        href="https://t.me/flkrdstudio" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                    >
                        <TelegramIcon className="w-5 h-5" style={{marginRight: '0.5rem'}}/>
                        <span>{selectedContent.telegramButton}</span>
                    </a>
                  </div>
                </div>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="p-4 border-t border-overlay dark:border-dark-overlay flex-shrink-0">
          {!isInformational ? (
            <>
              <p className="text-xs text-center text-muted dark:text-dark-muted mb-3">{selectedContent.agreement}</p>
              <button
                onClick={onAgree}
                className="w-full px-4 py-3 bg-highlight text-white font-semibold rounded-full shadow-lg hover:bg-opacity-90 transition-transform transform btn-premium-glow"
              >
                {selectedContent.agreeButton}
              </button>
            </>
          ) : (
            <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-overlay dark:bg-dark-overlay font-semibold rounded-full hover:bg-opacity-80"
              >
                {selectedContent.closeButton}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;