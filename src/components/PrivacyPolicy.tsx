import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
              <p>We collect information that you provide directly to us when you create an account, post a listing, or communicate with other users.</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Personal Data:</strong> Name, email address, phone number, and profile picture.</li>
                <li><strong>Property Data:</strong> Details about properties you list, including images and location details.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform.</li>
                <li><strong>Verification Data:</strong> Documents provided for account verification (stored securely and accessed only for verification purposes).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p>We use the collected data to provide, maintain, and improve our services, including:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Facilitating connections between tenants and landlords.</li>
                <li>Processing payments and preventing fraud.</li>
                <li>Sending administrative and marketing communications (you can opt-out of marketing).</li>
                <li>Verifying user identities to maintain platform safety.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Data Sharing</h2>
              <p>We do not sell your personal data. We share information only in specific circumstances:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>With other users: To facilitate rental inquiries and agreements.</li>
                <li>With service providers: Who perform services on our behalf (e.g., payment processors).</li>
                <li>Legal requirements: When required by law or to protect our rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p>
                We implement robust security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Your Choices</h2>
              <p>
                You may access, update, or delete your personal information at any time through your account settings or by contacting our support team.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-100">
              <p className="text-sm italic">Last Updated: April 30, 2026</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
