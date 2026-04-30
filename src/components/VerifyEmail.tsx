import React, { useEffect, useState } from 'react';
import { api } from '@/src/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function VerifyEmail({ onNavigate }: { onNavigate?: (page: any) => void }) {
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const codeFromUrl = searchParams.get('code');
  const emailFromUrl = searchParams.get('email');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [message, setMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualEmail, setManualEmail] = useState(emailFromUrl || '');

  const navigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page as any);
    } else {
      window.location.href = '/';
    }
  };

  const handleVerify = async (codeValue: string, emailValue?: string) => {
    setStatus('loading');
    try {
      const res = await api.verifyEmail({ token: token || undefined, code: codeValue || undefined, email: emailValue });
      setStatus('success');
      setMessage(res.message || 'Your email has been verified successfully!');
      toast.success('Email verified!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Verification failed. The code may be expired or invalid.');
    }
  };

  useEffect(() => {
    if (token || codeFromUrl) {
      handleVerify(codeFromUrl || '', emailFromUrl || undefined);
    } else {
      setStatus('manual');
    }
  }, [token, codeFromUrl, emailFromUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full shadow-xl border-none">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-serif">Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && "One moment while we verify your account..."}
            {status === 'success' && "Your account is now fully active."}
            {status === 'error' && "We couldn't verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="flex flex-col items-center text-center space-y-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            
            {status === 'manual' && (
              <div className="w-full space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded-lg" 
                    placeholder="name@example.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium">Verification Code</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg text-center text-2xl tracking-widest font-bold" 
                    placeholder="123456"
                    maxLength={6}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleVerify(manualCode, manualEmail)}
                  disabled={!manualCode || !manualEmail}
                >
                  Verify Now
                </Button>
              </div>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                <p className="text-slate-600">{message}</p>
                <Button className="w-full" onClick={() => navigate('/')}>
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-destructive" />
                <p className="text-slate-600">{message}</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
