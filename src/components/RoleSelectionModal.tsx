import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Building2, Home, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/src/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onRoleSelected: (role: string) => void;
}

export function RoleSelectionModal({ isOpen, onClose, userId, onRoleSelected }: RoleSelectionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async (role: 'tenant' | 'agent' | 'landlord') => {
    if (!userId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      
      toast.success(`Account set up as ${role}`);
      onRoleSelected(role);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to Nyumbani Hub!</DialogTitle>
          <DialogDescription className="text-center">
            How do you plan to use the platform? You can change this later in settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-6">
          <button
            disabled={loading}
            onClick={() => handleSelectRole('tenant')}
            className="flex items-center gap-4 p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-primary group-hover:text-white transition-colors">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900">I'm looking for a house</div>
              <div className="text-sm text-slate-500">Browse verified listings and apply securely.</div>
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => handleSelectRole('agent')}
            className="flex items-center gap-4 p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-primary group-hover:text-white transition-colors">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900">I'm a Real Estate Agent</div>
              <div className="text-sm text-slate-500">List properties and manage multiple clients.</div>
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => handleSelectRole('landlord')}
            className="flex items-center gap-4 p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-primary group-hover:text-white transition-colors">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900">I'm a Property Owner</div>
              <div className="text-sm text-slate-500">List your own houses and find trusted tenants.</div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          By continuing, you agree to our terms of service and privacy policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}
