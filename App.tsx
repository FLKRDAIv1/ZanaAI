
import React, { useState, useEffect, useRef } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import PermissionPrimer from './components/PermissionPrimer';

export type Theme = 'light' | 'dark';

const reEngagementMessages = [
    'زانا AI چاوەڕێتە، وەرەوە با قسە بکەین! 😊',
    'ماوەیەکی زۆرە ونیت! بیرۆکەیەکی نوێت هەیە بیگەڕێین؟ 🤔',
    'Zana AI misses you! Come back to continue our conversation. ✨',
    'Ready to learn something new? Zana is here to help. 🤖'
];

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState;
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">ببورە، کێشەیەک ڕوویدا! 😟</h2>
          <p className="text-zinc-400 mb-8">ئەپڵیکەیشنەکە تووشی کێشەیەکی تەکنیکی بوو. تکایە دووبارە دەستیپێبکەرەوە.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-bold rounded-2xl">دووبارە بارکردنەوە</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState<boolean>(() => {
    return localStorage.getItem('zana_privacy_accepted') === 'true';
  });
  const [isAuthComplete, setIsAuthComplete] = useState<boolean>(() => {
    return localStorage.getItem('zana_splash_seen') === 'true';
  });
  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    return localStorage.getItem('zana_large_text') === 'true';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('zana_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });
  
  const [notificationPrimer, setNotificationPrimer] = useState<{
      isOpen: boolean;
      permission: 'camera' | 'microphone' | 'notification' | null;
      isDenied: boolean;
      onAllow: () => void;
  }>({ isOpen: false, permission: null, isDenied: false, onAllow: () => {} });
  
  const inactivityTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthComplete && hasAcceptedPrivacy) {
        const notificationPrompted = localStorage.getItem('zana_notification_prompted');
        if (!notificationPrompted && 'Notification' in window && Notification.permission === 'default') {
            const timer = setTimeout(() => {
                setNotificationPrimer({
                    isOpen: true,
                    permission: 'notification',
                    isDenied: false,
                    onAllow: () => {
                        Notification.requestPermission();
                        setNotificationPrimer(p => ({ ...p, isOpen: false }));
                        localStorage.setItem('zana_notification_prompted', 'true');
                    }
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }
  }, [isAuthComplete, hasAcceptedPrivacy]);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = window.setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const randomIndex = Math.floor(Math.random() * reEngagementMessages.length);
            const body = reEngagementMessages[randomIndex];
            new Notification('زانا AI', {
                body: body,
                icon: '/icons/icon-192x192.png',
                tag: 'zana-re-engagement'
            });
        }
    }, 5 * 60 * 60 * 1000);
  };

  useEffect(() => {
      const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      const handleUserActivity = () => resetInactivityTimer();
      activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));
      resetInactivityTimer();
      return () => {
          if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
          activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
      };
  }, []);

  useEffect(() => {
    let currentUserId = localStorage.getItem('zana_user_id');
    if (!currentUserId) {
      currentUserId = crypto.randomUUID();
      localStorage.setItem('zana_user_id', currentUserId);
    }
    setUserId(currentUserId);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('zana_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('zana_large_text', isLargeText.toString());
  }, [isLargeText]);

  const handlePrivacyAccept = () => {
    localStorage.setItem('zana_privacy_accepted', 'true');
    setHasAcceptedPrivacy(true);
  };

  const handleAuthComplete = () => {
    localStorage.setItem('zana_splash_seen', 'true');
    setIsAuthComplete(true);
  };

  if (!userId) {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-base dark:bg-dark-base">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-dark-primary"></div>
        </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`h-screen w-screen font-sans antialiased overflow-hidden ${isLargeText ? 'large-text-mode' : ''}`}>
        {!hasAcceptedPrivacy ? (
          <PrivacyPolicyModal isOpen={true} onAgree={handlePrivacyAccept} isInformational={false} />
        ) : !isAuthComplete ? (
          <Auth onComplete={handleAuthComplete} />
        ) : (
          <Chat 
              key={userId} 
              userId={userId} 
              theme={theme} 
              setTheme={setTheme} 
              isLargeText={isLargeText} 
              setIsLargeText={setIsLargeText} 
          />
        )}
        
        {notificationPrimer.isOpen && notificationPrimer.permission && (
            <PermissionPrimer
                isOpen={notificationPrimer.isOpen}
                permission={notificationPrimer.permission}
                onAllow={notificationPrimer.onAllow}
                onClose={() => {
                    setNotificationPrimer(p => ({ ...p, isOpen: false }));
                    localStorage.setItem('zana_notification_prompted', 'true');
                }}
                isDenied={notificationPrimer.isDenied}
            />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
