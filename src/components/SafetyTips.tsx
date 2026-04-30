import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Smartphone, Eye, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export function SafetyTips() {
  const tips = [
    {
      icon: <Eye className="h-6 w-6 text-blue-500" />,
      title: "View the Property",
      description: "Always visit the property in person before making any payments. Ensure the listing matches what you see."
    },
    {
      icon: <Lock className="h-6 w-6 text-emerald-500" />,
      title: "Secure Payments",
      description: "Only use our secure integrated payment methods. Avoid direct cash transfers or wiring money to individuals you haven't met."
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      title: "Too Good to be True",
      description: "Be cautious of listings with prices significantly lower than the market rate. If it seems too good to be true, it likely is."
    },
    {
      icon: <Smartphone className="h-6 w-6 text-purple-500" />,
      title: "In-App Messaging",
      description: "Keep your conversations within the Nyumbani Hub platform to maintain a record of all agreements and interactions."
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: "Verified Badges",
      description: "Look for 'Verified' badges on property listings and user profiles. This indicates we've performed extra checks on those accounts."
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Safety Tips</h1>
          </div>
          
          <p className="text-lg text-slate-600 mb-12 leading-relaxed">
            At Nyumbani Hub, your safety is our top priority. While we work hard to verify listings and users, it's important to stay vigilant. Follow these guidelines for a safe rental experience.
          </p>

          <div className="space-y-8">
            {tips.map((tip, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="shrink-0">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    {tip.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{tip.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{tip.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-blue-50 rounded-2xl border border-blue-100 italic text-blue-800 text-center">
            "Your safety is a shared responsibility. Stay alert, trust your instincts, and report any suspicious activity immediately."
          </div>
        </motion.div>
      </div>
    </div>
  );
}
