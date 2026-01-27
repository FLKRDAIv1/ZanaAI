import React from 'react';
import { cn } from '@/lib/utils';

interface DeviceFrameProps {
    children: React.ReactNode;
    className?: string;
}

export function DeviceFrame({ children, className }: DeviceFrameProps) {
    return (
        <div className="flex items-center justify-center min-h-screen p-8 perspective-1000">
            {/* iPhone 17 Pro Max Chassis */}
            <div
                className={cn(
                    "relative w-[430px] h-[932px] bg-black rounded-[60px] shadow-2xl overflow-hidden border-[14px] border-[#1a1a1a]",
                    "ring-1 ring-white/10 ring-offset-4 ring-offset-black/50",
                    "before:absolute before:inset-0 before:rounded-[46px] before:border-[2px] before:border-white/5 before:pointer-events-none",
                    className
                )}
                style={{
                    boxShadow: '0 0 0 2px #333, 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px -20px rgba(100, 100, 255, 0.2)'
                }}
            >
                {/* Dynamic Island Area */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-b-[24px] z-50 flex items-center justify-center">
                    <div className="w-[80px] h-[24px] bg-black rounded-full flex items-center justify-between px-2">
                        <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                        <div className="w-2 h-2 rounded-full bg-[#0a0a0a]" />
                    </div>
                </div>

                {/* Status Bar Time (Left) */}
                <div className="absolute top-[14px] left-[32px] text-white text-[15px] font-semibold z-40 select-none">
                    9:41
                </div>

                {/* Status Bar Icons (Right) */}
                <div className="absolute top-[14px] right-[28px] flex items-center gap-[6px] z-40 text-white select-none">
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                        <path d="M14 0H2C0.89543 0 0 0.89543 0 2V10C0 11.1046 0.89543 12 2 12H14C15.1046 12 16 11.1046 16 10V2C16 0.89543 15.1046 0 14 0ZM14 10H2V2H14V10Z" fill="currentColor" />
                        <path d="M18 4V8C18 8.55228 17.5523 9 17 9H16V3H17C17.5523 3 18 3.44772 18 4Z" fill="currentColor" />
                    </svg>
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M1 6C1 2.5 3.5 0 8 0C12.5 0 15 2.5 15 6C15 9.5 16 11 16 11H0C0 11 1 9.5 1 6Z" fill="currentColor" /></svg>
                </div>

                {/* Main Screen Content */}
                <div className="w-full h-full bg-black/90 backdrop-blur-3xl overflow-hidden relative">

                    {/* Background Glow */}
                    <div className="absolute inset-x-0 -top-40 h-[500px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute inset-x-0 -bottom-40 h-[500px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

                    {children}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[140px] h-[5px] bg-white rounded-full z-50 pointer-events-none" />
            </div>
        </div>
    );
}
