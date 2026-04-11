import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, UserCheck, CreditCard, ArrowRight, Star, MapPin, Search, Home as HomeIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/src/services/api';
import { Property } from '@/src/types';
import { PropertyCard } from './PropertyCard';

interface LandingPageProps {
  onExplore: () => void;
  onSearch: (filters: { location: string; type: string; priceRange: string }) => void;
}

export function LandingPage({ onExplore, onSearch }: LandingPageProps) {
  const [location, setLocation] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await api.getProperties();
        setFeaturedProperties(data.slice(0, 3));
      } catch (err) {
        console.error("Error fetching featured properties", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleQuickSearch = () => {
    onSearch({ location, type: 'all', priceRange: 'all' });
    onExplore();
  };

  return (
    <div className="flex flex-col bg-[#fcfbf9] text-[#1a1a1a]">
      {/* Split Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col lg:flex-row overflow-hidden">
        {/* Left Content */}
        <div className="lg:w-1/2 flex flex-col justify-center px-6 lg:px-20 py-20 bg-white relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="h-[2px] w-8 bg-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Premium Real Estate Kenya</span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl leading-[0.9] tracking-tight mb-8">
              Find Your <br />
              <span className="italic text-primary">Perfect</span> Space.
            </h1>
            <p className="text-lg text-slate-500 max-w-md mb-12 leading-relaxed font-light">
              Nyumbani Hub connects you with hand-picked, verified properties across Kenya. Experience a seamless rental journey with zero scams.
            </p>

            {/* Quick Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-slate-50 border rounded-2xl shadow-sm mb-12 max-w-xl">
              <div className="flex-1 flex items-center px-4 gap-3">
                <MapPin className="h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Where do you want to live?" 
                  className="border-none bg-transparent focus-visible:ring-0 text-base p-0 h-12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-8 rounded-xl font-bold gap-2"
                onClick={handleQuickSearch}
              >
                <Search className="h-5 w-5" />
                Find Home
              </Button>
            </div>

            <div className="flex items-center gap-8">
              <div>
                <div className="text-2xl font-bold">12k+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Listings</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200" />
              <div>
                <div className="text-2xl font-bold">8k+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Tenants</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200" />
              <div>
                <div className="text-2xl font-bold">500+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Agents</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Image/Visual */}
        <div className="lg:w-1/2 relative min-h-[50vh] lg:min-h-full">
          <img 
            src="https://picsum.photos/seed/nairobi-modern/1200/1600" 
            alt="Modern Nairobi Apartment" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent lg:block hidden" />
          
          {/* Floating Property Card Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute bottom-12 right-12 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/20 max-w-xs hidden md:block"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Verified</div>
              <div className="text-primary font-bold">KSh 85,000</div>
            </div>
            <h3 className="font-serif italic text-xl mb-1">The Skyview Penthouse</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
              <MapPin className="h-3 w-3" /> Westlands, Nairobi
            </p>
            <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={onExplore}>View Details</Button>
          </motion.div>
        </div>
      </section>

      {/* Trust & Verification Section */}
      <section className="py-24 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl mb-4">The Nyumbani Standard</h2>
            <p className="text-slate-500">We've built the most secure ecosystem for renting in Kenya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Listings</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Every property listed goes through a rigorous verification process. We check title deeds and ownership documents.
              </p>
            </div>
            <div className="text-center group">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UserCheck className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Background Checks</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                We perform background checks on all agents and landlords. You're dealing with real, accountable professionals.
              </p>
            </div>
            <div className="text-center group">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">Escrow Payments</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Your deposit is held in a secure escrow account and only released when you've successfully moved in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-serif text-5xl md:text-6xl mb-6">Simple. Secure. <span className="italic text-primary">Seamless.</span></h2>
            <p className="text-lg text-slate-500 font-light">Your journey to a new home in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            {/* Decorative Line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 hidden md:block" />
            
            {[
              { 
                step: "01", 
                title: "Discover", 
                desc: "Browse our curated collection of verified listings. Filter by location, price, and lifestyle amenities.",
                icon: <Search className="h-6 w-6" />
              },
              { 
                step: "02", 
                title: "Apply", 
                desc: "Submit your application directly through our secure portal. We handle the background checks and verification.",
                icon: <CheckCircle2 className="h-6 w-6" />
              },
              { 
                step: "03", 
                title: "Move In", 
                desc: "Secure your home with our escrow protection. Your deposit is safe until you've successfully moved in.",
                icon: <HomeIcon className="h-6 w-6" />
              },
            ].map((item, i) => (
              <div key={i} className="relative bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="text-6xl font-serif font-black text-slate-50 mb-6 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-12">Trusted by Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale contrast-125">
            <div className="text-2xl font-serif font-bold italic tracking-tighter">EquityBank</div>
            <div className="text-2xl font-serif font-bold italic tracking-tighter">Safaricom</div>
            <div className="text-2xl font-serif font-bold italic tracking-tighter">KCB Group</div>
            <div className="text-2xl font-serif font-bold italic tracking-tighter">KnightFrank</div>
            <div className="text-2xl font-serif font-bold italic tracking-tighter">HassConsult</div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-24 bg-[#fcfbf9]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-2">Featured Collections</h2>
              <p className="text-slate-500">Hand-picked properties that meet our highest standards.</p>
            </div>
            <Button variant="link" className="text-primary font-bold" onClick={onExplore}>
              View All Listings <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProperties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} onNavigate={onExplore as any} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-24 bg-[#1a1a1a] text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-serif text-5xl md:text-6xl mb-8 leading-tight">
                Explore <br />
                <span className="italic text-primary">Neighborhoods</span>
              </h2>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                From the bustling streets of Westlands to the serene greenery of Karen, find the neighborhood that fits your lifestyle.
              </p>
              
              <div className="space-y-6">
                {[
                  { name: 'Kilimani', count: '1,240 Properties' },
                  { name: 'Westlands', count: '850 Properties' },
                  { name: 'Karen', count: '420 Properties' },
                  { name: 'Lavington', count: '630 Properties' },
                ].map((loc, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => { setLocation(loc.name); handleQuickSearch(); }}
                  >
                    <span className="text-xl font-serif italic group-hover:text-primary transition-colors">{loc.name}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">{loc.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square">
              <img 
                src="https://picsum.photos/seed/nairobi-aerial/1000/1000" 
                className="w-full h-full object-cover rounded-[5rem] grayscale hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary rounded-full flex items-center justify-center text-center p-4 rotate-12 shadow-2xl">
                <span className="text-white font-bold text-sm leading-tight uppercase tracking-tighter">Verified by Nyumbani</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-white text-center relative">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-5xl md:text-7xl mb-8">Ready to move?</h2>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-light">
            Join thousands of Kenyans who have found their perfect living space through Nyumbani Hub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-none" onClick={onExplore}>
              Find Your Home
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-bold rounded-none border-[#1a1a1a]">
              List Property
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
