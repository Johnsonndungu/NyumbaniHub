import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/src/services/api';
import { toast } from 'sonner';
import { Loader2, CreditCard, Smartphone, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe (replace with your public key)
const stripePromise = loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  propertyId: string;
  purpose: 'deposit' | 'rent';
  onSuccess: () => void;
}

function StripeForm({ amount, propertyId, purpose, onSuccess, onCancel }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const user = api.getCurrentUser();
      const { clientSecret, paymentId } = await api.createStripeIntent({
        amount,
        propertyId,
        userId: user.id,
        purpose
      });

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement) as any,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        await api.updatePaymentStatus(paymentId, { status: 'failed' });
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          await api.updatePaymentStatus(paymentId, { status: 'completed', transactionId: result.paymentIntent.id });
          toast.success('Payment successful!');
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-slate-50">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={!stripe || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Pay KSh {amount.toLocaleString()}
        </Button>
      </div>
    </form>
  );
}

export function PaymentModal({ isOpen, onClose, amount, propertyId, purpose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'mpesa' | 'stripe' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [retryCount, setRetryCount] = useState(0);

  const handleMpesaPayment = async () => {
    if (!phoneNumber.match(/^(2547|2541|07|01)\d{8}$/)) {
      toast.error('Please enter a valid Safaricom phone number');
      return;
    }

    // Format to 254...
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);

    setLoading(true);
    setStatus('pending');
    try {
      const user = api.getCurrentUser();
      const res = await api.initiateMpesa({
        phoneNumber: formattedPhone,
        amount,
        propertyId,
        userId: user.id,
        purpose
      });
      setPaymentId(res.paymentId);
      toast.info('STK Push sent to your phone. Please enter your PIN.');
      
      // Start polling for status
      pollPaymentStatus(res.paymentId);
    } catch (err: any) {
      toast.error(err.message);
      setStatus('failed');
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 1 minute polling

    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await api.getPaymentStatus(id);
        if (data.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          setLoading(false);
          toast.success('Payment confirmed!');
          setTimeout(onSuccess, 1500);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          setLoading(false);
          toast.error('Payment failed or cancelled');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus('failed');
        setLoading(false);
        toast.error('Payment confirmation timed out. If you paid, please contact support with your transaction ID.');
      }
    }, 3000);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (method === 'mpesa') handleMpesaPayment();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Secure Payment</DialogTitle>
          <DialogDescription>
            Complete your {purpose} payment for property ID: {propertyId.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex justify-between items-center">
            <span className="text-slate-500">Total Amount</span>
            <span className="text-2xl font-bold text-primary">KSh {amount.toLocaleString()}</span>
          </div>

          {!method && status === 'idle' && (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setMethod('mpesa')}
              >
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <Smartphone className="h-6 w-6" />
                </div>
                <span className="font-bold">M-Pesa</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => setMethod('stripe')}
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <CreditCard className="h-6 w-6" />
                </div>
                <span className="font-bold">Card / Stripe</span>
              </Button>
            </div>
          )}

          {method === 'mpesa' && status !== 'completed' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Safaricom Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="0712345678" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              {status === 'pending' ? (
                <div className="text-center py-6 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-slate-500">Waiting for M-Pesa confirmation...</p>
                </div>
              ) : status === 'failed' ? (
                <div className="text-center py-6 space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <p className="text-sm text-destructive font-medium">Payment failed or connection lost</p>
                  <Button onClick={handleRetry} className="gap-2">
                    <RefreshCcw className="h-4 w-4" /> Retry Payment
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setMethod(null)}>Back</Button>
                  <Button className="flex-1" onClick={handleMpesaPayment}>Pay with M-Pesa</Button>
                </div>
              )}
            </div>
          )}

          {method === 'stripe' && status !== 'completed' && (
            <Elements stripe={stripePromise}>
              <StripeForm 
                amount={amount} 
                propertyId={propertyId} 
                purpose={purpose} 
                onSuccess={() => setStatus('completed')}
                onCancel={() => setMethod(null)}
              />
            </Elements>
          )}

          {status === 'completed' && (
            <div className="text-center py-10 space-y-4">
              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold">Payment Successful!</h3>
              <p className="text-slate-500">Your transaction has been confirmed.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
