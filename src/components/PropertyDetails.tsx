import { useState } from 'react';
import { Property } from '@/src/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, ShieldCheck, Star, CheckCircle2, Phone, Mail, Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface PropertyDetailsProps {
  property: Property;
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    // Simulate application
    setTimeout(() => {
      setIsApplying(false);
      toast.success("Application submitted!", {
        description: "The agent will contact you soon regarding your application for " + property.title
      });
    }, 1500);
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-primary/5" />}>
        View Details
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold">{property.title}</DialogTitle>
              <div className="flex items-center text-slate-500 text-sm gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">KSh {property.price.toLocaleString()}</div>
              <div className="text-xs text-slate-500">per month</div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="space-y-6">
            <div className="aspect-video rounded-xl overflow-hidden">
              <img 
                src={property.images[0]} 
                alt={property.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 p-4 bg-slate-50 rounded-xl text-center">
                <Bed className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                <div className="font-bold">{property.bedrooms}</div>
                <div className="text-xs text-slate-500">Bedrooms</div>
              </div>
              <div className="flex-1 p-4 bg-slate-50 rounded-xl text-center">
                <Bath className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                <div className="font-bold">{property.bathrooms}</div>
                <div className="text-xs text-slate-500">Bathrooms</div>
              </div>
              <div className="flex-1 p-4 bg-slate-50 rounded-xl text-center">
                <Home className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                <div className="font-bold capitalize">{property.type}</div>
                <div className="text-xs text-slate-500">Type</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-3">Description</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {property.description}
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-3">Amenities</h4>
              <div className="grid grid-cols-2 gap-2">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 border rounded-2xl bg-slate-50/50">
              <h4 className="font-bold mb-4">Listed by</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {property.ownerType === 'agent' ? 'A' : 'L'}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {property.ownerType === 'agent' ? 'Premium Realty Ltd' : 'Private Landlord'}
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-slate-500 ml-1">(42 reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Phone className="h-4 w-4" />
                  Show Phone Number
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Mail className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </div>

            <div className="p-6 border rounded-2xl bg-white shadow-sm">
              <h4 className="font-bold mb-4">Interested in this house?</h4>
              <p className="text-sm text-slate-500 mb-6">
                Submit your application directly to the {property.ownerType}. They will review your profile and get back to you within 24 hours.
              </p>
              <Button 
                onClick={handleApply} 
                disabled={isApplying}
                className="w-full h-12 text-lg font-bold"
              >
                {isApplying ? "Submitting..." : "Apply Now"}
              </Button>
              <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-widest">
                Secure application powered by Nyumbani Hub
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
