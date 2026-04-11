import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/src/services/api';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'tenant'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot-password') {
        const res = await api.forgotPassword(formData.email);
        toast.success(res.message);
        setMode('login');
        return;
      }

      let data;
      if (mode === 'login') {
        data = await api.login({ email: formData.email, password: formData.password });
        toast.success(`Welcome back, ${data.user.displayName}!`);
      } else {
        data = await api.signup(formData);
        toast.success(`Account created! Welcome, ${data.user.displayName}!`);
      }
      onSuccess(data.user);
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'login') return 'Welcome Back';
    if (mode === 'signup') return 'Create Account';
    return 'Reset Password';
  };

  const getDescription = () => {
    if (mode === 'login') return 'Enter your credentials to access your account.';
    if (mode === 'signup') return 'Join Nyumbani Hub to find your next home.';
    return 'Enter your email to receive a password reset link.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setMode('login');
      }
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{getTitle()}</DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {mode !== 'forgot-password' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    className="text-xs text-primary hover:underline"
                    onClick={() => setMode('forgot-password')}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="tenant">Tenant looking for a home</option>
                <option value="landlord">Landlord listing a property</option>
                <option value="agent">Real Estate Agent</option>
              </select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-slate-500">
            {mode === 'login' ? "Don't have an account? " : mode === 'signup' ? "Already have an account? " : "Remember your password? "}
          </span>
          <button
            type="button"
            className="text-primary font-bold hover:underline"
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
