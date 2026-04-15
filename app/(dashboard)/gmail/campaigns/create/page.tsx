'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Send, ArrowRight, ArrowLeft, 
  CheckCircle2, Mail, Users, AlertCircle, Trash2, 
  Eye, Save, Rocket, Info, Laptop, ListPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useAuth } from '@/hooks/useAuth';

type Step = 'import' | 'compose' | 'review';

export default function CreateCampaignPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('import');
  const [importType, setImportType] = useState<'file' | 'manual' | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // -- Handlers --
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (file.name.endsWith('.csv')) {
        Papa.parse(bstr as string, {
          header: true,
          complete: (results: Papa.ParseResult<any>) => {
            setRecipients(results.data);
            toast.success(`${results.data.length} recipients imported!`);
            setStep('compose');
          }
        });
      } else {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setRecipients(data);
        toast.success(`${data.length} recipients imported!`);
        setStep('compose');
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const processManualInput = () => {
    const emails = manualInput.split('\n').map(e => e.trim()).filter(e => e.includes('@'));
    if (emails.length === 0) {
      toast.error('No valid emails found');
      return;
    }
    const data = emails.map(email => ({ Email: email, Name: email.split('@')[0] }));
    setRecipients(data);
    toast.success(`${data.length} emails added!`);
    setStep('compose');
  };

  const handleLaunch = () => {
    if (!subject || !body) {
      toast.error('Please fill in subject and body');
      return;
    }
    setIsProcessing(true);
    // TODO: Actual API call
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Campaign launched successfully! 🚀');
      window.location.href = '/gmail/dashboard';
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 'import':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto mb-8">
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Select Target Audience</h2>
               <p className="text-[13px] text-slate-500 font-medium">Choose how to provide the list of recipients.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
               {/* File Upload Option */}
               <div 
                 onClick={() => setImportType('file')}
                 className={cn(
                   "group relative overflow-hidden rounded-2xl border-2 transition-all p-8 cursor-pointer",
                   importType === 'file' ? "border-red-500 bg-red-50/10 shadow-lg" : "border-slate-100 hover:border-slate-200 bg-white"
                 )}
               >
                  <div className="flex flex-col items-center text-center">
                     <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500", importType === 'file' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400")}>
                        <Upload className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Import Spreadsheet</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Drag & Drop CSV or Excel.<br/>Auto-detection enabled.
                     </p>
                  </div>
                  {importType === 'file' && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                       <input type="file" id="campaign-file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                       <label htmlFor="campaign-file" className="w-full inline-flex items-center justify-center h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer transition-all">
                          Select File
                       </label>
                    </div>
                  )}
               </div>

               {/* Manual Input Option */}
               <div 
                 onClick={() => setImportType('manual')}
                 className={cn(
                   "group relative overflow-hidden rounded-2xl border-2 transition-all p-8 cursor-pointer",
                   importType === 'manual' ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-100 hover:border-slate-200 bg-white"
                 )}
               >
                  <div className="flex flex-col items-center text-center">
                     <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500", importType === 'manual' ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400")}>
                        <ListPlus className="w-5 h-5" />
                     </div>
                     <h3 className={cn("text-lg font-black uppercase tracking-tight mb-2", importType === 'manual' ? "text-white" : "text-slate-900")}>Manual Input</h3>
                     <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-relaxed", importType === 'manual' ? "text-white/50" : "text-slate-400")}>
                        Paste email addresses.<br/>One per line.
                     </p>
                  </div>
                  {importType === 'manual' && (
                    <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4">
                       <textarea 
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="example@gmail.com&#10;user@domain.com"
                        className="w-full h-24 bg-white/10 border border-white/20 rounded-xl p-3 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-all resize-none"
                       />
                       <Button onClick={processManualInput} className="w-full h-10 bg-white text-slate-900 hover:bg-white/90 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">
                          Process List
                       </Button>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        );

      case 'compose':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
             <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">Compose Campaign</h2>
                   <p className="text-[12px] text-slate-500 font-medium flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-red-500" /> Sending to {recipients.length} recipients
                   </p>
                </div>
                <Button onClick={() => setStep('import')} variant="ghost" className="text-slate-400 hover:text-slate-900 font-black uppercase text-[9px] tracking-widest flex items-center gap-2">
                   <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject Line</label>
                      <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="High conversion subject..."
                        className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold text-slate-900 focus:outline-none focus:border-red-500/20 transition-all text-sm"
                      />
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Body</label>
                         <div className="flex items-center gap-2 text-[8px] font-black uppercase text-red-500/50">
                            Personalization:
                            {['Name', 'Email'].map(tag => (
                              <button 
                                key={tag} 
                                onClick={() => setBody(b => b + `{{${tag}}}`)}
                                className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100"
                              >
                                + {tag}
                              </button>
                            ))}
                         </div>
                      </div>
                      <textarea 
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write message... Use {{Name}}"
                        className="w-full h-64 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[13px] font-medium text-slate-600 focus:outline-none focus:border-red-500/20 transition-all resize-none leading-relaxed"
                      />
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                      <div className="relative z-10 space-y-6">
                         <h4 className="text-sm font-black uppercase tracking-widest mb-4">Preview Simulation</h4>
                         <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">To: {recipients[0]?.Email || 'recipient@domain.com'}</p>
                            <p className="text-[10px] font-bold">{subject || 'No Subject'}</p>
                            <div className="h-[1px] bg-white/10 w-full" />
                            <p className="text-[11px] text-white/60 leading-relaxed truncate">
                               {body.replace('{{Name}}', recipients[0]?.Name || 'Name') || 'Message content will appear here...'}
                            </p>
                         </div>
                         <Button onClick={() => setStep('review')} className="w-full h-14 bg-white text-slate-900 hover:bg-white/90 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
                            Next Stage <ArrowRight className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>

                   <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                         <Info className="w-5 h-5 text-amber-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Campaign Stats</span>
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Total Recipients</span>
                            <span>{recipients.length}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Estimated Time</span>
                            <span>{Math.ceil(recipients.length / 10)} mins</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        );

      case 'review':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto space-y-8"
          >
             <div className="text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Rocket className="w-7 h-7 text-red-500 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Final Review</h2>
                <p className="text-[13px] text-slate-500 font-medium">Verify details before launching the campaign.</p>
             </div>

             <div className="space-y-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-8 space-y-6 shadow-sm">
                   <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-6">
                      <div>
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Recipients</label>
                         <p className="text-lg font-black text-slate-900">{recipients.length} Emails</p>
                      </div>
                      <div>
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Admin</label>
                         <p className="text-lg font-black text-slate-900 truncate">{user?.displayName?.split(' ')[0] || 'Profile'}</p>
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Subject</label>
                      <p className="text-md font-bold text-slate-700 truncate">{subject}</p>
                   </div>
                </div>

                <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] flex items-start gap-4">
                   <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                   <p className="text-xs text-red-800 leading-relaxed font-medium">
                      By launching this campaign, you confirm that these recipients have opted in to receive your communications. 
                      Sending spam may result in Gmail account suspension.
                   </p>
                </div>
             </div>

             <div className="flex gap-4">
                <Button onClick={() => setStep('compose')} className="flex-1 h-12 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
                   Back
                </Button>
                <Button 
                   onClick={handleLaunch} 
                   disabled={isProcessing}
                   className="flex-[2] h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all"
                >
                   {isProcessing ? 'Launching...' : 'Ignite Campaign'} <Send className="w-4 h-4 flex-shrink-0" />
                </Button>
             </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="pb-20 pt-6">
       {/* Stepper Header */}
       <div className="max-w-xs mx-auto mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 z-0" />
          <div className="relative z-10 flex justify-between items-center">
             {[
               { id: 'import', label: 'Audience', icon: Users },
               { id: 'compose', label: 'Message', icon: Mail },
               { id: 'review', label: 'Launch', icon: Rocket }
             ].map((s, idx) => {
               const isActive = s.id === step;
               const isCompleted = ['import', 'compose', 'review'].indexOf(step) > idx;
               return (
                 <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 border-2",
                      isActive ? "bg-red-500 text-white border-red-500 shadow-md rotate-6" : 
                      isCompleted ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-300 border-slate-100"
                    )}>
                       {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest", isActive ? "text-slate-900" : "text-slate-400")}>{s.label}</span>
                 </div>
               );
             })}
          </div>
       </div>

       {renderStep()}
    </div>
  );
}
