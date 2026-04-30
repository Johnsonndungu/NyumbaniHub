import { Home, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: any) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleNav = (page: string) => {
    onNavigate(page as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">NyumbaniHub</span>
            </div>
            <p className="text-sm leading-relaxed">
              Kenya's most trusted house rental platform. Connecting tenants with verified landlords and agents since 2024.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => handleNav('home')} className="hover:text-primary transition-colors">Find a House</button></li>
              <li><button onClick={() => handleNav('dashboard')} className="hover:text-primary transition-colors">List Your Property</button></li>
              <li><button onClick={() => handleNav('home')} className="hover:text-primary transition-colors">Verified Agents</button></li>
              <li><button onClick={() => handleNav('dashboard')} className="hover:text-primary transition-colors">Landlord Portal</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><button onClick={() => handleNav('home')} className="hover:text-primary transition-colors">Help Center</button></li>
              <li><button onClick={() => handleNav('safety-tips')} className="hover:text-primary transition-colors">Safety Tips</button></li>
              <li><button onClick={() => handleNav('terms')} className="hover:text-primary transition-colors">Terms of Service</button></li>
              <li><button onClick={() => handleNav('privacy')} className="hover:text-primary transition-colors">Privacy Policy</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>12th Floor, Westlands Business Park, Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+254 700 000 000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>info@nyumbanihub.co.ke</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} Nyumbani Hub. All rights reserved. Made with ❤️ for Kenya.</p>
        </div>
      </div>
    </footer>
  );
}
