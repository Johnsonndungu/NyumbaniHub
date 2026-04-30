import React, { useState, useRef, useEffect } from 'react';
import { Property } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/src/services/api';

interface NewListingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  property?: Property;
}

export function NewListingForm({ onSuccess, onCancel, property }: NewListingFormProps) {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    location: property?.location || '',
    price: property?.price?.toString() || '',
    type: property?.type || 'apartment',
    country: property?.country || 'Kenya',
    bedrooms: property?.bedrooms?.toString() || '',
    bathrooms: property?.bathrooms?.toString() || '',
    amenities: property?.amenities?.join(', ') || '',
    ownerType: property?.ownerType || 'agent',
  });
  const [imageUrls, setImageUrls] = useState<string[]>(property?.images || []);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const addImageUrl = () => {
    if (currentImageUrl && !imageUrls.includes(currentImageUrl)) {
      setImageUrls([...imageUrls, currentImageUrl]);
      setCurrentImageUrl('');
    }
  };

  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter(u => u !== url));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && !imageUrls.includes(result)) {
          setImageUrls(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = api.getCurrentUser();
    if (!currentUser) {
      toast.error("You must be signed in to list a property.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        images: imageUrls.length > 0 ? imageUrls : [`https://picsum.photos/seed/${Math.random()}/800/600`],
        ownerId: currentUser.id,
        status: property?.status || 'available'
      };

      if (property) {
        await api.updateProperty(property.id, payload);
      } else {
        await api.createProperty(payload);
      }

      toast.success(`Property ${property ? 'updated' : 'listed'} successfully!`);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${property ? 'update' : 'create'} listing. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Property Title</Label>
          <Input 
            id="title" 
            placeholder="e.g. Modern 2 Bedroom Apartment" 
            required 
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            placeholder="e.g. Kilimani, Nairobi" 
            required 
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select 
            value={formData.country} 
            onValueChange={(value: any) => setFormData({ ...formData, country: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kenya">Kenya</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Monthly Rent (KSh)</Label>
          <Input 
            id="price" 
            type="number" 
            placeholder="65000" 
            required 
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Property Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="bedsitter">Bedsitter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input 
            id="bedrooms" 
            type="number" 
            placeholder="2" 
            required 
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input 
            id="bathrooms" 
            type="number" 
            placeholder="2" 
            required 
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Describe the property, its features, and the neighborhood..." 
          className="min-h-[100px]"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <Label>Property Images</Label>
        
        {/* Upload Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
            isDragging ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
          )}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500">PNG, JPG or WEBP (max. 5MB)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">OR</span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="flex gap-2">
          <Input 
            placeholder="Paste image URL here..." 
            value={currentImageUrl}
            onChange={(e) => setCurrentImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addImageUrl();
              }
            }}
          />
          <Button type="button" onClick={addImageUrl} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Add URL
          </Button>
        </div>
        
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border bg-slate-100">
                <img 
                  src={url} 
                  alt={`Property ${index + 1}`} 
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => removeImageUrl(url)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">Add at least one image. You can upload files or use external URLs.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amenities">Amenities (comma separated)</Label>
        <Input 
          id="amenities" 
          placeholder="WiFi, Parking, Gym, Security" 
          value={formData.amenities}
          onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {property ? 'Update Property' : 'List Property'}
        </Button>
      </div>
    </form>
  );
}
