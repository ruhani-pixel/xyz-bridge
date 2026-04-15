'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { 
  Lock, Mail, Key, Shield, AlertTriangle, Zap,
  Settings as SettingsIcon, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { GmailSecurityGuide } from '@/components/ui/GmailSecurityGuide';

export default function GmailSettingsPage() {
  const { role, user, adminData } = useAuth();
  const [showGmailGuide, setShowGmailGuide] = useState(false);
  const [config, setConfig] = useState({
    gmail_email: '',
    gmail_app_password: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/user/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.config) {
          setConfig({
            gmail_email: data.config.gmail_email || '',
            gmail_app_password: data.config.gmail_app_password || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success('Gmail settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (role === 'agent') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Lock className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Access Restricted</h2>
        <p className="text-slate-400 text-sm">Only Company Head can manage settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase italic leading-none">
            Gmail <span className="text-red-500">Security</span> & Config
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em]">Configure your high-volume mailing engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           <Card className="bg-white border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden">
             <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                         <Mail className="w-7 h-7 text-white" />
                      </div>
                      <div>
                         <CardTitle className="text-lg font-black uppercase tracking-tight">SMTP Credentials</CardTitle>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Google connection</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setShowGmailGuide(true)}
                     className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                   >
                     <Key className="w-3.5 h-3.5" /> Setup Guide
                   </button>
                </div>
             </CardHeader>
             <CardContent className="p-10">
                <form onSubmit={handleSaveConfig} className="space-y-8">
                   {/* Gmail Address */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Gmail Address</label>
                      <input 
                        type="email" 
                        value={config.gmail_email}
                        onChange={(e) => setConfig({...config, gmail_email: e.target.value})}
                        placeholder="you@gmail.com"
                        className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-red-500/20 shadow-inner transition-all"
                      />
                   </div>

                   {/* App Password */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">App Password</label>
                        <button 
                          type="button"
                          onClick={async () => {
                            if (!config.gmail_email || !config.gmail_app_password) {
                              toast.error('Please enter Email and Password first');
                              return;
                            }
                            const loading = toast.loading('Verifying SMTP Connection...');
                            try {
                              const res = await fetch('/api/gmail/verify', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ 
                                  senderEmail: config.gmail_email,
                                  appPassword: config.gmail_app_password 
                                })
                              });
                              const data = await res.json();
                              toast.dismiss(loading);
                              if (data.success) toast.success('Connection Verified! Ready to send. 🔥');
                              else toast.error(data.error || 'Connection Failed');
                            } catch {
                              toast.dismiss(loading);
                              toast.error('Connection timeout. Please check your internet.');
                            }
                          }}
                          className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center gap-2 group"
                        >
                          <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /> Test Connection
                        </button>
                      </div>
                      <input 
                        type="password" 
                        value={config.gmail_app_password}
                        onChange={(e) => setConfig({...config, gmail_app_password: e.target.value})}
                        placeholder="xxxx xxxx xxxx xxxx"
                        className="w-full h-16 px-6 border-slate-100 rounded-2xl font-mono text-sm tracking-widest focus:outline-none focus:border-red-500/20 bg-slate-50 shadow-inner"
                      />
                      <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                         <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                         <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                            Gmail daily limit is 500 recipients. Excess emails will be queued or rejected by Google.
                         </p>
                      </div>
                   </div>

                   <div className="pt-6">
                      <Button type="submit" disabled={saving} className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-slate-900/20">
                         {saving ? 'Syncing...' : 'Save & Secure Configuration'}
                      </Button>
                   </div>
                </form>
             </CardContent>
           </Card>
        </div>

        <div className="space-y-8">
           {/* Security Status */}
           <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                       <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Infrastructure</span>
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-4 leading-tight">Secure Vault Protection</h3>
                 <p className="text-sm text-white/50 font-medium leading-relaxed">
                    Aapka password hamare high-security server-side vault mein store hota hai. Ye browser ya frontend code mein kabhi nahi dikhta.
                 </p>
              </div>
           </div>

           {/* Quick Tips */}
           <div className="p-10 bg-white border border-slate-100 rounded-[3rem] space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-50 rounded-xl"><Info className="w-4 h-4 text-slate-400" /></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">SMTP Pro Tips</span>
              </div>
              <ul className="space-y-4">
                 {[
                   'Gmail primary address hi choose karein',
                   'App Password copy karte waqt spaces hata dein',
                   'Har 6 mahine mein password refresh karein',
                   '2FA account par enable hona zaruri hai'
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-3 text-[11px] font-bold text-slate-600">
                      <span className="text-red-500">●</span> {tip}
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>

      <GmailSecurityGuide 
        isOpen={showGmailGuide} 
        onClose={() => setShowGmailGuide(false)}
      />
    </div>
  );
}
