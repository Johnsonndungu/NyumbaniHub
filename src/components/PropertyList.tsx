import { Property } from '@/src/types';
import { PropertyCard } from './PropertyCard';
import { Button } from '@/components/ui/button';

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern 2 Bedroom Apartment',
    description: 'Beautiful apartment in the heart of Kilimani with modern finishes and great views.',
    location: 'Kilimani, Nairobi',
    price: 65000,
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    images: ['https://picsum.photos/seed/apt1/800/600'],
    ownerId: 'agent1',
    ownerType: 'agent',
    status: 'available',
    amenities: ['WiFi', 'Parking', 'Gym'],
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Spacious 4 Bedroom Villa',
    description: 'Luxury villa in a gated community in Runda. Perfect for a large family.',
    location: 'Runda, Nairobi',
    price: 250000,
    type: 'house',
    bedrooms: 4,
    bathrooms: 4,
    images: ['https://picsum.photos/seed/house1/800/600'],
    ownerId: 'landlord1',
    ownerType: 'landlord',
    status: 'available',
    amenities: ['Swimming Pool', 'Garden', 'Security'],
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Cozy Studio in Westlands',
    description: 'Compact and stylish studio apartment, ideal for young professionals.',
    location: 'Westlands, Nairobi',
    price: 45000,
    type: 'studio',
    bedrooms: 1,
    bathrooms: 1,
    images: ['https://picsum.photos/seed/studio1/800/600'],
    ownerId: 'agent2',
    ownerType: 'agent',
    status: 'available',
    amenities: ['WiFi', 'Elevator', 'Backup Generator'],
    createdAt: new Date()
  },
  {
    id: '4',
    title: '3 Bedroom Townhouse',
    description: 'Modern townhouse in Syokimau with easy access to the expressway.',
    location: 'Syokimau, Machakos',
    price: 55000,
    type: 'house',
    bedrooms: 3,
    bathrooms: 3,
    images: ['https://picsum.photos/seed/townhouse1/800/600'],
    ownerId: 'agent3',
    ownerType: 'agent',
    status: 'available',
    amenities: ['Parking', 'Borehole', 'Solar Heating'],
    createdAt: new Date()
  },
  {
    id: '5',
    title: 'Executive 1 Bedroom in Nyali',
    description: 'Beachfront apartment in Nyali with stunning ocean views.',
    location: 'Nyali, Mombasa',
    price: 80000,
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    images: ['https://picsum.photos/seed/mombasa1/800/600'],
    ownerId: 'landlord2',
    ownerType: 'landlord',
    status: 'available',
    amenities: ['Beach Access', 'AC', 'Pool'],
    createdAt: new Date()
  },
  {
    id: '6',
    title: 'Budget Bedsitter in Roysambu',
    description: 'Affordable and clean bedsitter near TRM mall.',
    location: 'Roysambu, Nairobi',
    price: 12000,
    type: 'bedsitter',
    bedrooms: 0,
    bathrooms: 1,
    images: ['https://picsum.photos/seed/bedsitter1/800/600'],
    ownerId: 'agent4',
    ownerType: 'agent',
    status: 'available',
    amenities: ['Water Included', 'Security'],
    createdAt: new Date()
  }
];

export function PropertyList() {
  return (
    <section className="py-16 bg-slate-50">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_PROPERTIES.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button size="lg" variant="outline" className="px-12">
            View All Properties
          </Button>
        </div>
      </div>
    </section>
  );
}
