import { useState, useEffect } from 'react';
import { Property } from '@/src/types';
import { PropertyCard } from './PropertyCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/src/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface PropertyListProps {
  filters?: {
    location: string;
    type: string;
    priceRange: string;
  };
  onNavigate?: (page: 'home' | 'dashboard' | 'admin' | 'messages' | 'tenant-dashboard') => void;
}

export function PropertyList({ filters, onNavigate }: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);

      if (!isFirebaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const propsRef = collection(db, 'properties');
        let q = query(propsRef, orderBy('createdAt', 'desc'));

        if (filters?.type && filters.type !== 'all') {
          q = query(q, where('type', '==', filters.type));
        }

        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));

        // Client-side filtering for location and price range (Firestore has limits on multiple where clauses with different fields)
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
            <p className="text-slate-500 mt-2">Discover the best properties across Kenya handpicked for you.</p>
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
