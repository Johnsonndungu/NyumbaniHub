import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PropertyList } from './components/PropertyList';
import { AgentDashboard } from './components/AgentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TenantDashboard } from './components/TenantDashboard';
import { Chat } from './components/Chat';
import { Footer } from './components/Footer';
import { ShieldCheck, UserCheck, CreditCard, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';

function FeatureSection() {
  const features = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Smart Search",
      description: "Filter by location, price, and property type to find exactly what you need in seconds."
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: "Verified Agents",
      description: "We verify every agent and landlord on our platform to ensure you only see legitimate listings."
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Secure Applications",
      description: "Apply for houses directly through the platform. Your data is safe and encrypted."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Secure Payments",
      description: "Pay your deposit and rent securely via M-Pesa or Card with our integrated gateway."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why Choose Nyumbani Hub?</h2>
          <p className="mt-4 text-lg text-slate-500">We're revolutionizing the Kenyan real estate market with transparency and security.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="p-4 bg-primary/5 rounded-2xl">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard'>('home');
  const [filters, setFilters] = useState({
    location: '',
    type: 'all',
    priceRange: 'all'
  });

  const handleSearch = (newFilters: { location: string; type: string; priceRange: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      <main>
        {currentPage === 'home' ? (
          <>
            <Hero onSearch={handleSearch} />
            <FeatureSection />
            <PropertyList filters={filters} onNavigate={setCurrentPage} />
            
            {/* CTA Section */}
            <section className="py-24 bg-primary relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                 <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
              </div>
              <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Are you a Landlord or Agent?</h2>
                <p className="mt-6 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                  Join thousands of verified partners listing their properties on Nyumbani Hub. Get more leads and manage applications easily.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                  >
                    Start Listing Today
                  </button>
                  <button className="bg-primary-foreground/10 text-white border border-white/20 px-8 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : currentPage === 'dashboard' ? (
          <AgentDashboard />
        ) : currentPage === 'tenant-dashboard' ? (
          <TenantDashboard onNavigate={setCurrentPage} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="container mx-auto px-4 py-12">
            <Chat />
          </div>
        )}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
