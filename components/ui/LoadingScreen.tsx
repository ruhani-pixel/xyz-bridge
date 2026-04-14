'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  const texts = [
    "Designing Excellence...",
    "Connecting Solid Models...",
    "Securing Communications...",
    "Preparing Dashboard..."
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 800);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* Subtle Light Aura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.05)_0%,_transparent_70%)]" />
          
          <div className="relative flex flex-col items-center">
            {/* Logo with Gold Pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative mb-12"
            >
              <div className="absolute inset-0 bg-brand-gold/10 blur-2xl rounded-full scale-110 animate-pulse" />
              <div className="relative w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-xl p-4 border border-slate-100">
                <img 
                  src="/logo.png" 
                  alt="Solid Models" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

            {/* Animated Text */}
            <div className="h-8 text-center">
              <motion.p
                key={textIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-slate-400 font-bold tracking-[0.3em] uppercase text-[10px]"
              >
                {texts[textIndex]}
              </motion.p>
            </div>

            {/* Loading Bar */}
            <div className="w-40 h-[1.5px] bg-slate-100 mt-8 relative overflow-hidden rounded-full">
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 className="absolute inset-0 bg-brand-gold/40"
               />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
