'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { AdminUser, UserRole } from '@/types/user';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function UserManagementPage() {
  const { role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only superadmin can see all users
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as AdminUser[];
      setUsers(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleApprove = async (uid: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { isApproved: !currentStatus });
      toast.success(currentStatus ? 'User unapproved' : 'User approved successfully!');
    } catch (error) {
      toast.error('Galti ho gayi... Status badal nahi paye.');
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      toast.error('Role update fails.');
    }
  };

  if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
     return <div className="h-full flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest opacity-30">Access Denied</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Team Matrix</h1>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest mt-1">Manage infrastructure access & roles</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-gold" />
              <span className="text-xs font-black text-brand-gold uppercase">{users.length} Total Registered</span>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Matrix...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8 py-5">User Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Role</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approval Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Integration</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid} className="border-slate-50 text-slate-600 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <Avatar name={user.name || ''} size="md" />
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm tracking-tight leading-none mb-1">{user.name}</span>
                        <span className="text-[10px] font-medium text-slate-400">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select 
                      className="bg-slate-50 border-none rounded-lg h-9 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-1 focus:ring-brand-gold cursor-pointer"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                    >
                      <option value="user">User</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "w-2 h-2 rounded-full",
                         user.isApproved ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                       )} />
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest",
                         user.isApproved ? "text-emerald-600" : "text-rose-500"
                       )}>
                         {user.isApproved ? 'Approved' : 'Pending'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex gap-1.5">
                        <div className={cn("p-1.5 rounded-lg border", user.msg91_integrated_number ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-300")} title="MSG91 Linked">
                           <MessageSquareIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className={cn("p-1.5 rounded-lg border", user.accountType === 'platform' ? "bg-brand-gold/5 border-brand-gold/10 text-brand-gold" : "bg-slate-50 border-slate-100 text-slate-300")} title="AI Platform Active">
                           <BotIcon className="w-3.5 h-3.5" />
                        </div>
                     </div>
                  </TableCell>
                  <TableCell className="pr-8">
                    <div className="flex items-center gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={() => handleApprove(user.uid, user.isApproved)}
                         className={cn(
                           "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-sm border",
                           user.isApproved 
                            ? "bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100" 
                            : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                         )}
                       >
                         {user.isApproved ? (
                           <><XCircle className="w-3.5 h-3.5" /> Revoke</>
                         ) : (
                           <><CheckCircle2 className="w-3.5 h-3.5" /> Approve</>
                         )}
                       </Button>
                       <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                          <MoreVertical className="w-5 h-5" />
                       </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  );
}

// Icons
function MessageSquareIcon({ className }: any) {
  return <div className={className}>💬</div>;
}
function BotIcon({ className }: any) {
  return <div className={className}>🤖</div>;
}
