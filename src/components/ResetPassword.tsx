import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/src/services/api';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';

interface ResetPasswordProps {
  onSuccess: () => void;
}

export function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        token,
        newPassword: formData.password
      });
      setCompleted(true);
      toast.success("Password reset successfully!");
      
      // Clear token from URL
      window.history.replaceState({}, '', window.location.pathname);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">Password Updated</CardTitle>
          <CardDescription className="mb-8">
            Your password has been successfully reset. You can now sign in with your new password.
          </CardDescription>
          <Button onClick={onSuccess} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
