'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  UserCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link2,
  Copy
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ExportButton } from '@/components/ui/ExportButton';

export default function TeamPage() {
  const { user, adminData } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);

  // 1. Listen for Team Members
  useEffect(() => {
    if (!adminData?.uid) return;
    const tenantId = adminData.tenantId || adminData.uid;
    
    const q = query(
      collection(db, 'users'),
      where('tenantId', '==', tenantId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(list.filter(m => m.id !== adminData.uid));
    });

    return () => unsub();
  }, [adminData]);

  // 2. Listen for Pending Invites
  useEffect(() => {
    if (!adminData?.uid) return;
    const tenantId = adminData.tenantId || adminData.uid;

    const q = query(
      collection(db, 'invitations'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [adminData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/user/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite');

      toast.success(data.message);
      setEmail('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = (inviteId: string) => {
     const baseUrl = window.location.origin;
     const inviteUrl = `${baseUrl}/accept-invite?id=${inviteId}`;
     navigator.clipboard.writeText(inviteUrl);
     toast.success('Invite link copied to clipboard!');
  };

  const removeMember = async (uid: string) => {
     if (!confirm('Are you sure you want to remove this member?')) return;
     toast.info('Removing member...');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Team Management</h1>
          <p className="text-slate-500 font-medium text-sm max-w-lg">Invite your employees and give them 70% control of the inbox. High simplicity, zero training required.</p>
        </div>

        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
           {members.length > 0 && <ExportButton data={members} filename="team_members_list" />}
           
           <form onSubmit={handleInvite} className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <Input 
                  type="email"
                  placeholder="employee@gmail.com"
                  className="pl-10 h-11 border-none bg-slate-50 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                disabled={loading}
                className="bg-brand-gold hover:bg-brand-gold/90 text-white font-black uppercase tracking-widest text-[10px] h-11 rounded-xl px-6 gap-2"
              >
                <UserPlus className="w-4 h-4" /> {loading ? 'Inviting...' : 'Invite'}
              </Button>
            </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
             <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active Team Members ({members.length})
           </h3>

           {members.length === 0 ? (
             <Card className="border-none shadow-none bg-slate-100/50 p-12 text-center rounded-[2rem]">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <UserCircle className="w-8 h-8" />
               </div>
               <p className="text-slate-500 text-sm font-medium">No team members yet. Invite your first employee above!</p>
             </Card>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {members.map((member) => (
                 <Card key={member.id} className="border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden group">
                   <div className="p-5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                          {member.photoURL ? <img src={member.photoURL} alt="" /> : <UserCircle className="w-6 h-6 text-slate-300" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{member.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{member.email}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => removeMember(member.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Full Access
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Active Now</span>
                   </div>
                 </Card>
               ))}
             </div>
           )}
        </div>

        {/* Pending Invites */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
             <Clock className="w-4 h-4 text-brand-gold" /> Pending Invites ({invites.length})
           </h3>
           
           <div className="space-y-3">
             {invites.map((invite) => (
               <div key={invite.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group">
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-700">{invite.email}</span>
                   <span className="text-[9px] text-slate-400 font-medium">Link expires soon</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                       onClick={() => copyInviteLink(invite.id)}
                       className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-gold hover:bg-brand-gold/10 transition-all"
                       title="Copy Invite Link"
                    >
                       <Link2 className="w-4 h-4" />
                    </button>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                       <AlertCircle className="w-3 h-3 text-slate-300" />
                    </div>
                 </div>
               </div>
             ))}

             {invites.length === 0 && (
               <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No pending invites</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
