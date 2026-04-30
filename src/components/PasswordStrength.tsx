import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const calculateStrength = (p: string) => {
    let score = 0;
    if (!p) return 0;
    if (p.length >= 8) score += 1;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^a-zA-Z\d]/.test(p)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getLabel = (s: number) => {
    if (!password) return '';
    switch (s) {
      case 0:
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getColorClass = (s: number, index: number) => {
    if (index >= s) return 'bg-slate-200';
    if (s <= 1) return 'bg-red-500';
    if (s === 2) return 'bg-amber-500';
    if (s === 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
        <span className="text-slate-400">Security Strength</span>
        <span className={cn(
          strength <= 1 ? "text-red-500" : 
          strength === 2 ? "text-amber-500" : 
          strength === 3 ? "text-blue-500" : "text-emerald-500"
        )}>
          {getLabel(strength)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 h-1">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ 
              backgroundColor: index < strength ? 
                (strength <= 1 ? '#ef4444' : strength === 2 ? '#f59e0b' : strength === 3 ? '#3b82f6' : '#10b981') : 
                '#e2e8f0' 
            }}
            className="rounded-full h-full"
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        Best passwords have 8+ chars with mixed cases, numbers & symbols.
      </p>
    </div>
  );
}
