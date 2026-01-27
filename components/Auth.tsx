import React from 'react';
import { ZanaIcon } from './icons/ZanaIcon';

interface AuthProps {
  onComplete: () => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden relative">
      
      {/* Phone-shaped Container */}
      <div className="relative w-full max-w-[360px] md:max-w-[400px] h-[85vh] md:h-[800px] rounded-[48px] flex flex-col items-center justify-center z-10 mx-4">
        
        {/* 1. Animated Border Glow (Behind) */}
        {/* We use a conic gradient that is much larger than the container and rotates */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full animate-border-rotate opacity-100 blur-xl pointer-events-none"
             style={{
               background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #f97316, #22c55e, #06b6d4, #8b5cf6)'
             }}
        ></div>

         {/* 1.1 Sharp Animated Border (Closer) */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[103%] rounded-[52px] animate-border-rotate pointer-events-none opacity-80"
             style={{
               background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #f97316, #22c55e, #06b6d4, #8b5cf6)'
             }}
        ></div>

        {/* 2. The Black Screen Mask */}
        {/* This creates the inner part of the phone, leaving the gap visible as the border */}
        <div className="absolute inset-[3px] bg-black rounded-[45px] z-20 flex flex-col overflow-hidden animate-pulse-glow">
            
            {/* Subtle Side Glows */}
            <div className="absolute left-0 top-1/4 bottom-1/4 w-px bg-purple-500/50 blur-[2px]"></div>
            <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-cyan-500/50 blur-[2px]"></div>
            
            {/* Top Reflection/Notch Hint */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/5 rounded-b-xl backdrop-blur-sm z-30 border-b border-white/5"></div>

            {/* Inner Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-30 space-y-12 px-6">
                
                {/* Logo Area */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
                    <div className="relative z-10 w-32 h-32 rounded-3xl bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl">
                         <ZanaIcon className="w-24 h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                </div>

                {/* Text Area */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 tracking-tighter drop-shadow-sm">
                        Zana AI
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                         <span className="h-1 w-1 bg-green-500 rounded-full animate-ping"></span>
                         <p className="text-sm font-medium text-zinc-400 tracking-widest uppercase">
                            System Online
                         </p>
                    </div>
                </div>

            </div>

            {/* Bottom Button Area */}
            <div className="p-8 z-30">
                <button
                    onClick={onComplete}
                    className="group relative w-full py-4 bg-white text-black font-bold text-lg rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        دەستپێبکە
                        <span className="text-xs opacity-70 font-normal ml-2">Get Started</span>
                    </span>
                </button>
                <p className="text-[10px] text-zinc-600 text-center mt-4">
                    By continuing, you agree to our Terms & Privacy Policy.
                </p>
            </div>
        </div>
      </div>
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

    </div>
  );
};

export default Auth;