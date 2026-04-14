'use client';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header() {
  const { user, role } = useAuth();

  const handleLogout = async () => {
    document.cookie = 'firebase-token=; path=/; max-age=0';
    localStorage.removeItem('token');
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-40 sticky top-0">
      <div className="flex items-center gap-6 flex-1">
        {/* Productivity Search Branded Mockup */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200/50 w-full max-w-md group focus-within:bg-white focus-within:border-brand-gold/30 transition-all">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search conversations, logs or settings..." 
            className="bg-transparent border-none text-xs text-slate-600 focus:outline-none w-full placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-900 leading-none mb-1">{user?.displayName || user?.email}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{role}</span>
          </div>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 p-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-brand-gold text-xs font-bold shadow-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
