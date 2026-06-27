import React, { useState, useEffect, useRef } from 'react';
import { PaymentModal } from './PaymentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription,DialogHeader,DialogTitle,} from '@/components/ui/dialog';
import { api } from '@/src/services/api';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, RotateCcw } from 'lucide-react';
import { PasswordStrength } from './PasswordStrength';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'forgot-success' | 'verify-email'>('login');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [registrationAmount, setRegistrationAmount] = useState<number>(2000);
  const [resendTimer, setResendTimer] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    country: 'Kenya',
    role: 'tenant',
    verificationCode: ''
  });

  // Focus code input when verification mode opens
  useEffect(() => {
    if (mode === 'verify-email' && isOpen && codeInputRef.current) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [mode, isOpen]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (mode === 'verify-email' && formData.verificationCode.length === 6 && !loading) {
      handleSubmit(new Event('submit') as any);
    }
  }, [formData.verificationCode, mode, loading]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendCode = async () => {
    try {
      setLoading(true);
      await api.resendVerification(formData.email);
      toast.success("Verification code sent to your email!");
      setResendTimer(60); // 60 second cooldown
      setFormData({ ...formData, verificationCode: '' });
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot-password') {
        const res = await api.forgotPassword(formData.email);
        toast.success(res.message);
        setMode('forgot-success');
        return;
      }

      if (mode === 'verify-email') {
        if (!formData.verificationCode || formData.verificationCode.length !== 6) {
          toast.error("Please enter a 6-digit code");
          return;
        }
        await api.verifyEmail({ email: formData.email, code: formData.verificationCode });
        toast.success("Email verified successfully!");
        setMode('login');
        setFormData({ ...formData, verificationCode: '' });
        return;
      }

      let data;
      if (mode === 'login') {
        data = await api.login({ email: formData.email, password: formData.password });
        // If an agent/landlord hasn't paid registration fee, prompt for payment
        if ((data.user.role === 'agent' || data.user.role === 'landlord') && data.user.registrationPaid === false) {
          setPendingUser(data.user);
          setRegistrationAmount(2000);
          setShowPayment(true);
          setLoading(false);
          return;
        }
        toast.success(`Welcome back, ${data.user.displayName}!`);
      } else {
        data = await api.signup({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          country: formData.country,
          role: formData.role
        });
        toast.success(`Account created! Please verify your email.`);
        setMode('verify-email');
        // If agent/landlord, require registration payment
        if (formData.role === 'agent' || formData.role === 'landlord') {
          setPendingUser(data.user);
          setRegistrationAmount(2000);
          setShowPayment(true);
          setLoading(false);
          return;
        }
        return;
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
    if (mode === 'forgot-success') return 'Email Sent';
    if (mode === 'verify-email') return 'Verify Email';
    return 'Reset Password';
  };

  const getDescription = () => {
    if (mode === 'login') return 'Enter your credentials to access your account.';
    if (mode === 'signup') return 'Join Nyumbani Hub to find your next home.';
    if (mode === 'forgot-success') return `We've sent a password reset link to ${formData.email}.`;
    if (mode === 'verify-email') return `We've sent a 6-digit verification code to ${formData.email}.`;
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

        {mode === 'forgot-success' ? (
          <div className="py-8 text-center space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500">
              Please check your inbox (and your spam folder) for a link to reset your password.
            </p>
            <Button onClick={() => setMode('login')} className="w-full">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {mode === 'signup' && (
            <>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+254..."
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Kenya"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>
            </>
          )}

          {mode === 'verify-email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">6-Digit Verification Code</Label>
                <div className="relative">
                  <Input
                    ref={codeInputRef}
                    id="verificationCode"
                    placeholder="000000"
                    className="text-center text-3xl tracking-[8px] font-bold font-mono letter-spacing"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, verificationCode: value });
                    }}
                    disabled={loading}
                  />
                  {formData.verificationCode.length === 6 && (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                  )}
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Check your email for the 6-digit code. It may take a minute to arrive.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleResendCode}
                  disabled={loading || resendTimer > 0}
                >
                  <RotateCcw className="h-4 w-4" />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </Button>
              </div>
            </div>
          )}
          
          {mode !== 'verify-email' && (
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
          )}

          {mode !== 'forgot-password' && mode !== 'verify-email' && (
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
              {mode === 'signup' && <PasswordStrength password={formData.password} />}
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

          <Button type="submit" className="w-full" disabled={loading || (mode === 'verify-email' && formData.verificationCode.length !== 6)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'verify-email' ? (formData.verificationCode.length === 6 ? 'Verifying...' : 'Enter 6-digit code') : 'Send Reset Link'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 
             mode === 'signup' ? "Already have an account? " : 
             "Remembered your password? "}
          </span>
          <button
            type="button"
            className="text-primary font-bold hover:underline"
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
          </>
      )}
      </DialogContent>
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={registrationAmount}
        propertyId={pendingUser?.id || 'registration'}
        purpose={'deposit' as any}
        onSuccess={async () => {
          try {
            // mark user as paid
            if (pendingUser?.id) {
              const updated = await api.updateUser(pendingUser.id, { registrationPaid: true });
              const current = api.getCurrentUser() || {};
              const newUser = { ...current, registrationPaid: true };
              localStorage.setItem('user', JSON.stringify(newUser));
              setShowPayment(false);
              setPendingUser(null);
              onSuccess(updated);
              onClose();
            }
          } catch (err: any) {
            toast.error(err.message || 'Failed to confirm payment');
          }
        }}
      />
    </Dialog>
  );
}
