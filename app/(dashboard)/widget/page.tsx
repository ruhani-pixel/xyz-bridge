'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  Code2, Copy, CheckCircle2, Globe, MessageSquare, 
  Palette, Zap, Eye, EyeOff, Sparkles, Info, Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function WidgetPage() {
  const { user, adminData } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [customOrigin, setCustomOrigin] = useState('');
  
  // Widget customization
  const [brandColor, setBrandColor] = useState('#C5A059');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [greeting, setGreeting] = useState('Hi! How can we help you today? 👋');
  const [buttonText, setButtonText] = useState('Chat with us');
 
  useEffect(() => {
    setMounted(true);
    setCustomOrigin(window.location.origin);
  }, []);
 
  const tenantId = user?.uid || '';

  const embedCode = `<!-- Solid Models Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['SolidModelsWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id='solid-models-widget';js.src='${customOrigin}/widget.js';js.async=1;
    fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','smw'));
  smw('init', {
    tenantId: '${tenantId}',
    color: '${brandColor}',
    position: '${position}',
    greeting: '${greeting}',
    buttonText: '${buttonText}'
  });
</script>`;

  const chatHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AI Chat Assistant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --brand: ${brandColor};
      --brand-dim: ${brandColor}15;
      --bg: #ffffff;
      --surface: #f8fafc;
      --surface2: #f1f5f9;
      --border: #e2e8f0;
      --text: #040914;
      --text-muted: #64748b;
      --user-bubble: ${brandColor};
      --ai-bubble: #ffffff;
      --radius: 22px;
    }
    html, body { height: 100%; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
    .chat-root { height: 100vh; display: flex; flex-direction: column; max-width: 600px; margin: 0 auto; background: #fff; }
    .chat-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 10; }
    .chat-avatar { width: 44px; height: 44px; border-radius: 16px; background: var(--brand-dim); border: 2px solid var(--brand); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .chat-header-info h1 { font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
    .chat-header-info p { font-size: 12px; color: #22c55e; font-weight: 600; display: flex; align-items: center; gap: 5px; margin-top: 1px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }
    .chat-messages { flex: 1; overflow-y: auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 20px; scroll-behavior: smooth; background: #fff; }
    .msg-row { display: flex; align-items: flex-end; gap: 12px; width: 100%; }
    .msg-row.user { flex-direction: row-reverse; }
    .bubble { max-width: 80%; padding: 14px 20px; border-radius: var(--radius); font-size: 14.5px; line-height: 1.6; font-weight: 500; }
    .bubble.ai { background: var(--ai-bubble); border: 1px solid var(--border); border-bottom-left-radius: 4px; color: var(--text); box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
    .bubble.user { background: var(--user-bubble); border-bottom-right-radius: 4px; color: #fff; shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .msg-time { font-size: 10px; color: var(--text-muted); margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .greeting-card { background: var(--surface); border: 1.5px dashed var(--border); border-radius: 30px; padding: 40px 30px; text-align: center; margin: 40px 0; }
    .greeting-card h2 { font-size: 20px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 8px; color: var(--text); }
    .chat-input-area { padding: 20px 24px 32px; background: #fff; border-top: 1px solid var(--border); }
    .input-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 2px solid transparent; border-radius: 20px; padding: 10px 14px 10px 20px; transition: all 0.3s ease; }
    .input-row:focus-within { border-color: var(--brand); background: #fff; box-shadow: 0 0 0 4px var(--brand-dim); }
    #msgInput { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 15px; padding: 8px 0; resize: none; min-height: 24px; font-family: inherit; font-weight: 500; }
    #sendBtn { width: 42px; height: 42px; border-radius: 14px; border: none; background: var(--brand); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: transform 0.2s ease; }
    #sendBtn:hover { transform: scale(1.05); }
    #sendBtn:active { transform: scale(0.95); }
  </style>
</head>
<body>
  <div class="chat-root">
    <div class="chat-header">
      <div class="chat-avatar">🤖</div>
      <div class="chat-header-info">
        <h1>AI Assistant</h1>
        <p><span class="status-dot"></span> Online</p>
      </div>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="greeting-card" id="greetingCard">
        <h2>${greeting || 'Hi! How can we help you today?'}</h2>
        <p>Your dedicated support channel. Send a message to start chatting.</p>
      </div>
    </div>
    <div class="chat-input-area">
      <div class="input-row">
        <textarea id="msgInput" rows="1" placeholder="Type a message..."></textarea>
        <button id="sendBtn" onclick="sendMessage()">➤</button>
      </div>
    </div>
  </div>
  <script>
    const CONFIG = {
      apiBase: '${customOrigin}',
      tenantId: '${tenantId}',
      storageKey: 'sm_chat_' + '${tenantId}'
    };
    let visitorId = localStorage.getItem(CONFIG.storageKey + '_vid');
    let messages = JSON.parse(localStorage.getItem(CONFIG.storageKey + '_msgs') || '[]');

    function init() {
      if (!visitorId) {
        visitorId = 'web_' + Date.now();
        localStorage.setItem(CONFIG.storageKey + '_vid', visitorId);
      }
      renderMessages();
      setInterval(fetchReplies, 3000);

      // Handle Enter Key
      document.getElementById('msgInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    function renderMessages() {
      const c = document.getElementById('chatMessages');
      if (!c) return;
      const g = document.getElementById('greetingCard');
      if (messages.length > 0 && g) g.style.display = 'none';
      
      const html = messages.map(m => {
        const isUser = m.direction === 'inbound';
        const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        return '<div class="msg-row ' + (isUser?'user':'ai') + '">' +
          '<div style="display:flex; flex-direction:column; align-items:' + (isUser?'flex-end':'flex-start') + '">' +
          '<div class="bubble ' + (isUser?'user':'ai') + '">' + m.content + '</div>' +
          '<span class="msg-time">' + time + '</span>' +
          '</div></div>';
      }).join('');
      
      if (messages.length > 0) {
        c.innerHTML = html;
      }
      c.scrollTop = c.scrollHeight;
    }

    async function sendMessage() {
      const i = document.getElementById('msgInput');
      const text = i.value.trim();
      if (!text) return;
      i.value = '';
      const newMsg = { direction: 'inbound', content: text, timestamp: new Date().toISOString() };
      messages.push(newMsg);
      renderMessages();
      await fetch(CONFIG.apiBase + '/api/widget-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: CONFIG.tenantId, visitorId, message: text })
      });
    }

    async function fetchReplies() {
      const res = await fetch(CONFIG.apiBase + '/api/widget-chat?tenantId=' + CONFIG.tenantId + '&visitorId=' + visitorId);
      const data = await res.json();
      if (data.messages && data.messages.length > messages.length) {
        messages = data.messages;
        renderMessages();
        localStorage.setItem(CONFIG.storageKey + '_msgs', JSON.stringify(messages));
      }
    }
    init();
  </script>
</html>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(chatHtmlCode);
    setCopied(true);
    toast.success('Page source copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([chatHtmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('chat.html downloaded!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-gold/10 rounded-2xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Dedicated Chat Page</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Full AI Chat interface for your website</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Code2, step: '01', title: 'Copy or Download', desc: 'Get your pre-configured chat.html source code.' },
          { icon: Globe, step: '02', title: 'Upload to Site', desc: 'Add chat.html to any folder on your website.' },
          { icon: MessageSquare, step: '03', title: 'Start Chatting', desc: 'Users chat on the page, you reply from the CRM.' },
        ].map(({ icon: Icon, step, title, desc }) => (
          <Card key={step} className="p-5 rounded-2xl bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-black text-slate-100">{step}</span>
              <div className="w-8 h-8 bg-brand-gold/10 rounded-xl flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand-gold" />
              </div>
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customizer */}
        <Card className="p-6 rounded-3xl bg-white border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Personalise Interface</h2>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Brand Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-mono focus:outline-none focus:border-brand-gold/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Greeting Message</label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-gold/40 resize-none"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
             <p className="text-[10px] text-slate-400 leading-relaxed">
               "This page is designed to be a standalone AI assistant. Your customers can use it to get instant answers or reach out to your team directly."
             </p>
          </div>
        </Card>

        {/* Embed Code */}
        <div className="space-y-4">
          {/* SaaS URL Configuration */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">SaaS Endpoint Configuration</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black tracking-widest">
                   AUTO-DETECTED
                </div>
             </div>
             <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Confirm your SaaS URL below. This URL will be baked into the chat code to handle message routing.
             </p>
             <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:outline-none focus:border-brand-gold/40 transition-all font-bold"
                  placeholder="https://your-saas.com"
                />
             </div>
             <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center pt-1 italic">
                * If testing on localhost, change this to your production link for live use.
             </p>
          </div>

          <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">chat.html</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98]"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-gold hover:bg-brand-gold/90 text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98]"
                  title="Download File"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
            <pre className="p-5 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all h-64 custom-scrollbar">
              <code>{mounted ? chatHtmlCode : 'Loading configuration...'}</code>
            </pre>
          </Card>

          {/* Preview toggle */}
          <Button
            onClick={() => setPreview(!preview)}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl py-3 border border-dashed border-slate-200"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-xs font-black uppercase tracking-widest">{preview ? 'Hide Preview' : 'Preview Interface'}</span>
          </Button>

          {/* Plan notice */}
          {adminData?.planId === 'free_trial' && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                <strong>Starter Plan:</strong> Chat page shows "Powered by Solid Models" at bottom.{' '}
                <a href="/settings" className="underline font-black">Upgrade to Pro</a> to remove.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 p-8">
           <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 h-[400px] flex flex-col">
              {/* Mock Header */}
              <div className="p-4 border-b flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: brandColor + '20', border: `1.5px solid ${brandColor}` }}>🤖</div>
                 <div>
                    <p className="text-xs font-bold text-slate-900">AI Assistant</p>
                    <p className="text-[10px] text-green-500 font-medium">● Online</p>
                 </div>
              </div>
              {/* Mock Content */}
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-3">
                 <p className="text-lg">👋</p>
                 <p className="text-sm font-bold text-slate-800">{greeting || 'Hi! How can we help?'}</p>
                 <p className="text-[10px] text-slate-400">Preview of your standalone chat interface</p>
              </div>
              {/* Mock Input */}
              <div className="p-4 border-t">
                 <div className="h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 justify-between">
                    <span className="text-xs text-slate-400">Type a message...</span>
                    <span className="text-lg" style={{ color: brandColor }}>➤</span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
