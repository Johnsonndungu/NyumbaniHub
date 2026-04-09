import { useState } from 'react';
import { Search, MapPin, Home, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'motion/react';

interface HeroProps {
  onSearch: (filters: { location: string; type: string; priceRange: string }) => void;
}

export function Hero({ onSearch }: HeroProps) {
  const [location, setLocation] = useState('');
  const [type, setType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  const handleSearch = () => {
    onSearch({ location, type, priceRange });
    // Scroll to property list
    const element = document.getElementById('property-list');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
          >
            Find Your Perfect <span className="text-primary">Nyumbani</span> in Kenya
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg leading-8 text-slate-300"
          >
            Verified listings, secure payments, and trusted agents. Whether you're looking for an apartment in Kilimani or a house in Nyali, we've got you covered.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="rounded-2xl bg-white p-4 shadow-2xl md:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Location
                </label>
                <Input 
                  placeholder="e.g. Westlands, Nairobi" 
                  className="border-slate-200" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Home className="h-3 w-3" /> Property Type
                </label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Any Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Type</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="bedsitter">Bedsitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Banknote className="h-3 w-3" /> Price Range (KSh)
                </label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Price</SelectItem>
                    <SelectItem value="0-20000">Below 20k</SelectItem>
                    <SelectItem value="20000-50000">20k - 50k</SelectItem>
                    <SelectItem value="50000-100000">50k - 100k</SelectItem>
                    <SelectItem value="100000+">100k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  className="w-full h-10 gap-2 text-base font-semibold"
                >
                  <Search className="h-5 w-5" /> Search
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
