'use client';

import { useState } from 'react';
import { 
  FileText, Plus, Search, Star, StarOff, Copy, Trash2, Edit3,
  Mail, ChevronRight, CheckCircle2, Eye, Download, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  starred: boolean;
  usedCount: number;
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to {{Name}}! 🎉',
    body: 'Hi {{Name}},\n\nWelcome aboard! We\'re thrilled to have you with us.\n\nBest regards,\nThe Team',
    category: 'Onboarding',
    starred: true,
    usedCount: 0,
  },
  {
    id: '2',
    name: 'Follow-Up',
    subject: 'Quick follow up — {{Name}}',
    body: 'Hi {{Name}},\n\nI wanted to follow up on our previous conversation.\n\nWould you have 15 minutes this week to connect?\n\nBest,\n{{SenderName}}',
    category: 'Sales',
    starred: false,
    usedCount: 0,
  },
  {
    id: '3',
    name: 'Product Announcement',
    subject: '🚀 Big news for {{Name}}!',
    body: 'Dear {{Name}},\n\nWe are excited to announce our latest update that will transform the way you work.\n\nClick below to learn more.\n\nWarm regards,\nThe Product Team',
    category: 'Marketing',
    starred: false,
    usedCount: 0,
  },
  {
    id: '4',
    name: 'Invoice / Payment',
    subject: 'Your invoice is ready — {{Name}}',
    body: 'Hi {{Name}},\n\nPlease find attached your invoice for this month.\n\nAmount Due: ₹{{Amount}}\nDue Date: {{DueDate}}\n\nThank you for your business!\n\nRegards,\nAccounts Team',
    category: 'Finance',
    starred: false,
    usedCount: 0,
  },
];

const CATEGORIES = ['All', 'Onboarding', 'Sales', 'Marketing', 'Finance', 'Custom'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '', category: 'Custom' });

  const filtered = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || t.category === category;
    return matchSearch && matchCat;
  });

  const toggleStar = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
  };

  const copyTemplate = (t: Template) => {
    navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`);
    toast.success('Template copied to clipboard!');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error('Please fill all fields');
      return;
    }
    const t: Template = {
      id: Date.now().toString(),
      ...newTemplate,
      starred: false,
      usedCount: 0,
    };
    setTemplates(prev => [t, ...prev]);
    setNewTemplate({ name: '', subject: '', body: '', category: 'Custom' });
    setShowCreate(false);
    toast.success('Template created!');
  };

  const previewTemplate = templates.find(t => t.id === previewId);

  const downloadHardcodedTemplate = () => {
    const link = document.createElement('a');
    link.href = '/Campaign_Format.xlsx';
    link.download = 'SolidModels_Format.xlsx';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel File Downloaded!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Email <span className="text-red-500">Templates</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Reusable templates for mass campaigns
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> New Template
        </Button>
      </div>

      {/* Create Template Form */}
      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Create New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Template Name</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Welcome Email"
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-400/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
              <select
                value={newTemplate.category}
                onChange={e => setNewTemplate(p => ({ ...p, category: e.target.value }))}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-400/50 transition-all"
              >
                {['Onboarding', 'Sales', 'Marketing', 'Finance', 'Custom'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Subject Line</label>
            <input
              type="text"
              value={newTemplate.subject}
              onChange={e => setNewTemplate(p => ({ ...p, subject: e.target.value }))}
              placeholder="Use {{Name}} for personalization"
              className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-400/50 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Email Body</label>
            <textarea
              value={newTemplate.body}
              onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your template... Use {{Name}}, {{Email}} for personalization"
              rows={6}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-400/50 resize-none transition-all leading-relaxed"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="h-9 px-5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all"
            >
              Cancel
            </button>
            <Button
              onClick={createTemplate}
              className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest"
            >
              Save Template
            </Button>
          </div>
        </div>
      )}

      {/* Excel Template Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg animate-in fade-in duration-700">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
              <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                Excel Import Format <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[8px] rounded uppercase tracking-widest border border-blue-500/30">Auto Fill Features</span>
              </h3>
              <p className="text-[11px] text-slate-300 font-medium max-w-xl leading-relaxed">
                Send 500 emails at once by downloading this Excel file. Just open it, add your contacts (Email, Name, Subject, and Body text), save it as a CSV or Excel file, and upload it when you create a new campaign!
              </p>
              <div className="flex gap-4 mt-3">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fill Details in Excel</span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-Load Subject</span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-Load Body</span>
              </div>
            </div>
          </div>
          <Button
            onClick={downloadHardcodedTemplate}
            className="h-11 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Download className="w-4 h-4" /> Download Excel Format
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:border-slate-400 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-widest border transition-all',
                category === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid + Preview */}
      <div className={cn('grid gap-5', previewId ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')}>
        {/* Template cards */}
        <div className={cn('space-y-4', previewId && 'lg:col-span-2')}>
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center col-span-full">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-300 uppercase tracking-tight">No templates found</p>
            </div>
          ) : (
            filtered.map(t => (
              <div
                key={t.id}
                className={cn(
                  'bg-white border rounded-2xl p-5 hover:border-slate-300 transition-all cursor-pointer group',
                  previewId === t.id ? 'border-red-400 shadow-sm shadow-red-100' : 'border-slate-100'
                )}
                onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                        {t.category}
                      </span>
                      {t.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                    <p className="text-sm font-black text-slate-900 truncate">{t.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{t.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); toggleStar(t.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all"
                    >
                      {t.starred
                        ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        : <StarOff className="w-3.5 h-3.5 text-slate-300" />
                      }
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); copyTemplate(t); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Body preview line */}
                <p className="text-[10.5px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{t.body}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Used {t.usedCount}×</span>
                  <div className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-widest">
                    Preview <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview Panel */}
        {previewTemplate && (
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-right-4 fade-in duration-300">
            {/* Preview header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{previewTemplate.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{previewTemplate.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyTemplate(previewTemplate)}
                  className="h-8 px-4 flex items-center gap-1.5 bg-slate-900 text-white rounded-lg font-black uppercase text-[8.5px] tracking-widest hover:bg-slate-800 transition-all"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  onClick={() => setPreviewId(null)}
                  className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-slate-400 font-black text-sm"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Email preview */}
            <div className="p-6">
              {/* From / To / Subject */}
              <div className="space-y-2 pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase w-14 flex-shrink-0">Subject</span>
                  <span className="text-sm font-bold text-slate-800">{previewTemplate.subject}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase w-14 flex-shrink-0">Tags</span>
                  <div className="flex gap-2">
                    {['{{Name}}', '{{Email}}'].map(tag => (
                      <span key={tag} className="text-[8.5px] px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded font-mono font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="bg-slate-50 rounded-xl p-5">
                <pre className="text-[12.5px] text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">{previewTemplate.body}</pre>
              </div>

              {/* Action */}
              <div className="mt-4 flex gap-3">
                <a
                  href={`/gmail/campaigns/create?template=${previewTemplate.id}`}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all"
                >
                  Use This Template <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
