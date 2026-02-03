
import React, { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);

    useEffect(() => {
        // Check if dismissed previously
        const isDismissed = localStorage.getItem('install_prompt_dismissed');
        if (isDismissed) return;

        // Check if running in standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) return;

        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        if (isIOS) {
            setPlatform('ios');
            // Delay showing to not be intrusive immediately
            setTimeout(() => setShowPrompt(true), 3000);
        } else if (isAndroid) {
            setPlatform('android');
            setTimeout(() => setShowPrompt(true), 3000);
        }
    }, []);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('install_prompt_dismissed', 'true');
    };

    if (!showPrompt || !platform) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 pointer-events-auto"
                onClick={handleDismiss}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-md bg-white rounded-t-2xl p-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                        <img
                            src="/pwa-icon.png"
                            alt="App Icon"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h2 className="text-xl font-bold text-[#002855]">
                        Installeer die Toep
                    </h2>

                    <p className="text-gray-600">
                        Kry vinnige toegang deur Dra Mekaar se Laste op jou foon te installeer.
                    </p>

                    <div className="w-full bg-gray-50 rounded-xl p-4 mt-2">
                        {platform === 'ios' ? (
                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#002855] text-white text-xs font-bold">1</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Tik op <Share className="inline w-4 h-4 mx-1 text-blue-500" /> in jou blaaier
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#002855] text-white text-xs font-bold">2</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Scroll en kies 'Add to Home Screen'
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#002855] text-white text-xs font-bold">1</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Tik op die menu (3 kolletjies)
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#002855] text-white text-xs font-bold">2</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Kies 'Install App' of 'Add to Home Screen'
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full bg-[#D4A84B] hover:bg-[#b38e3f] text-white"
                        onClick={handleDismiss}
                    >
                        Verstaan
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
