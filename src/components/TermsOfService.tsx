import React from 'react';
import { motion } from 'motion/react';
import { ScrollText } from 'lucide-react';

export function TermsOfService() {
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
              <ScrollText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Nyumbani Hub, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
              <p>
                Nyumbani Hub provides an online platform that connects property seekers (tenants) with property owners, managers, or their authorized agents. We do not own, manage, or control the properties listed on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Obligations</h2>
              <p>Users must provide accurate, current, and complete information during the registration process and keep their account information updated. You are responsible for maintaining the confidentiality of your account password.</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>You must be at least 18 years old to use the platform.</li>
                <li>You agree not to post false, misleading, or deceptive content.</li>
                <li>You agree not to harass other users or violate any laws.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Property Listings</h2>
              <p>
                Agents and Landlords are solely responsible for the accuracy and completeness of their listings, including descriptions, prices, and availability. We reserves the right to remove any listing that violates our standards or policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Payments and Fees</h2>
              <p>
                Payments made through our platform are subject to our payment partners' terms. While we facilitate secure transactions, we are not a party to the rental agreement between tenants and landlords.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
              <p>
                Nyumbani Hub provides the platform "as is" and shall not be liable for any damages arising out of your use of the service, including disputes between users or property conditions.
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
