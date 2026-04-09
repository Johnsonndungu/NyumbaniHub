import { Property } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { PropertyDetails } from './PropertyDetails';

interface PropertyCardProps {
  property: Property;
  index: number;
  onNavigate?: (page: 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard') => void;
  key?: any;
}

export function PropertyCard({ property, index, onNavigate }: PropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-200">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={property.images[0] || 'https://picsum.photos/seed/house/800/600'} 
            alt={property.title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/90 text-slate-900 hover:bg-white/100 backdrop-blur-sm border-none">
              {property.type}
            </Badge>
            {property.status === 'available' && (
              <Badge className="bg-emerald-500 text-white border-none">Available</Badge>
            )}
          </div>
          <div className="absolute bottom-3 right-3">
             <div className="bg-primary text-white px-3 py-1 rounded-lg font-bold shadow-lg">
               KSh {property.price.toLocaleString()}
               <span className="text-xs font-normal opacity-80">/mo</span>
             </div>
          </div>
        </div>
        
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{property.title}</h3>
          </div>
          <div className="flex items-center text-slate-500 text-sm gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            <span>{property.location}</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-4">
          <div className="flex items-center gap-4 text-slate-600 text-sm">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4 text-slate-400" />
              <span>{property.bedrooms || 0} Beds</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4 text-slate-400" />
              <span>{property.bathrooms || 0} Baths</span>
            </div>
            <div className="ml-auto flex items-center gap-1 text-amber-500 font-medium">
              <Star className="h-3 w-3 fill-current" />
              <span>4.8</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <ShieldCheck className="h-3 w-3" />
              Verified {property.ownerType}
            </div>
          </div>
          <PropertyDetails property={property} onNavigate={onNavigate} />
        </CardFooter>
      </Card>
    </motion.div>
  );
}
