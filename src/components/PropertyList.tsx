import { useState, useEffect } from 'react';
import { Property } from '@/src/types';
import { PropertyCard } from './PropertyCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/src/services/api';

interface PropertyListProps {
  filters?: {
    location: string;
    country: string;
    type: string;
    priceRange: string;
  };
  onNavigate?: (page: any) => void;
}

export function PropertyList({ filters, onNavigate }: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      // No longer needed for MySQL
      /*
      if (!isFirebaseConfigured()) {
        setLoading(false);
        return;
      }
      */

      try {
        let data = await api.getProperties({ type: filters?.type, country: filters?.country });
        if (!Array.isArray(data)) data = [];

        // Client-side filtering for location and price range
        if (filters?.location) {
          const loc = filters.location.toLowerCase();
          data = data.filter(p => p.location.toLowerCase().includes(loc));
        }

        if (filters?.priceRange && filters.priceRange !== 'all') {
          const range = filters.priceRange;
          if (range === '0-20000') {
            data = data.filter(p => p.price <= 20000);
          } else if (range === '20000-50000') {
            data = data.filter(p => p.price > 20000 && p.price <= 50000);
          } else if (range === '50000-100000') {
            data = data.filter(p => p.price > 50000 && p.price <= 100000);
          } else if (range === '100000+') {
            data = data.filter(p => p.price > 100000);
          }
        }

        setProperties(data);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Could not load properties. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  return (
    <section id="property-list" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Featured Listings</h2>
            <p className="text-slate-500 mt-2">Discover the best properties across Kenya, USA, and Sierra Leone.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Newest</Button>
            <Button variant="outline" size="sm">Price: Low to High</Button>
            <Button variant="outline" size="sm">Price: High to Low</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-slate-500">Loading properties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="link" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-xl font-semibold text-slate-800">No properties found</h3>
            <p className="text-slate-500 mt-2">We couldn't find any properties matching your criteria.</p>
            <p className="text-slate-500">Please adjust your filters or check back later!</p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Show all properties
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Button size="lg" variant="outline" className="px-12">
            View All Properties
          </Button>
        </div>
      </div>
    </section>
  );
}
