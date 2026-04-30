export type UserRole = 'tenant' | 'landlord' | 'agent';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
  emailVerified: boolean;
  rating?: number;
  reviewCount?: number;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: any;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  country: 'Kenya' | 'USA' | 'Sierra Leone';
  price: number;
  type: 'apartment' | 'house' | 'studio' | 'bedsitter';
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  ownerId: string;
  ownerType: 'landlord' | 'agent';
  status: 'available' | 'rented' | 'pending';
  amenities: string[];
  createdAt: any;
}

export interface Application {
  id: string;
  propertyId: string;
  tenantId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: any;
}

export interface Review {
  id: string;
  targetId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Payment {
  id: string;
  userId: string;
  propertyId: string;
  amount: number;
  purpose: 'deposit' | 'rent';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: any;
}
