import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/config.js"
import { useForm } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Image as ImageIcon, Loader2, X, MapPin } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const CATEGORIES = [
  "Electronics", "Fashion", "Home&Garden", "Art&Crafts", 
  "Jewelry", "Vintage", "Sports", "Books"
];

const NewListingModal = ({ onProductAdded }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image State
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Location State
  const [locationData, setLocationData] = useState({
    address: "",
    lat: null,
    lng: null,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { category: "" }
  });

  // Watch category for manual validation if using custom Select components
  const selectedCategory = watch("category");

  // --- Google Places Autocomplete Logic ---
  useEffect(() => {
    if (!open) return;

    const initAutocomplete = () => {
      if (!locationInputRef.current || !window.google?.maps?.places) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        { types: ["geocode"] }
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;

        setLocationData({
          address: place.formatted_address || locationInputRef.current.value,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      });
    };

    const timer = setTimeout(initAutocomplete, 300);
    return () => clearTimeout(timer);
  }, [open]);

  // --- Geolocation Logic ---
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      return toast({ 
        variant: "destructive", 
        title: "Not supported", 
        description: "Geolocation is not supported by your browser." 
      });
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`
          );
          const data = await res.json();
          const address = data.results?.[0]?.formatted_address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setLocationData({ address, lat: latitude, lng: longitude });
          if (locationInputRef.current) locationInputRef.current.value = address;
        } catch {
          setLocationData({ address: "Pinned Location", lat: latitude, lng: longitude });
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        toast({ variant: "destructive", title: "Access Denied", description: "Please allow location access." });
        setLocationLoading(false);
      }
    );
  };

  // --- Image Handling ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 5) {
      return toast({ variant: "destructive", title: "Limit Reached", description: "Maximum 5 images allowed." });
    }

    const validFiles = files.filter(file => {
      const isValid = ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024;
      if (!isValid) toast({ variant: "destructive", title: "File Ignored", description: `${file.name} is too large or invalid format.` });
      return isValid;
    });

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- Reset/Close Logic ---
  const clearForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setLocationData({ address: "", lat: null, lng: null });
    reset();
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) clearForm();
    setOpen(newOpen);
  };

  // --- Form Submission ---
  const onSubmit = async (data) => {
  // Defensive check for location
  if (!locationData.address) {
    return toast({ 
      variant: "destructive", 
      title: "Location required", 
      description: "Please select a pickup location." 
    });
  }

  setIsSubmitting(true);
  try {
    // 1. Double-check the key matches your DevTools exactly
    const token = localStorage.getItem("jwt_token"); 
    
    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    const formData = new FormData();
    
    // 2. Prepare the product payload
    const productPayload = {
      name: data.name,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      category: data.category,
      description: data.description,
      pickupLocation: locationData.address,
      pickupLatitude: locationData.lat,
      pickupLongitude: locationData.lng,
    };

    // 3. Append JSON part as a Blob (Spring Boot requirement for @RequestPart)
    formData.append("product", new Blob([JSON.stringify(productPayload)], {
      type: 'application/json'
    }));
    
    // 4. Append images
    if (imageFiles.length === 0) {
      throw new Error("Please add at least one photo.");
    }

    imageFiles.forEach(file => {
      formData.append("images", file);
    });

    // 5. The Fetch Call
    const response = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { 
        // DO NOT set Content-Type; the browser handles it for FormData
        "Authorization": `Bearer ${token}`.trim() 
      },
      body: formData
    });

    // 6. Handle specific 403 error for better debugging
    if (response.status === 403) {
      throw new Error("Access Denied: Ensure you are logged in as a Seller.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create product");
    }

    const result = await response.json();
    onProductAdded(result);
    toast({ title: "Success", description: "Your item is now live!" });
    setOpen(false);
    clearForm(); // Reset state after success

  } catch (error) {
    console.error("Submission Error:", error);
    toast({ 
      variant: "destructive", 
      title: "Submission failed", 
      description: error.message 
    });
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="marketplace-gradient text-white shadow-lg hover:scale-105 transition-transform">
          <Plus className="w-4 h-4 mr-2" /> New Listing
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Title</Label>
            <Input id="name" {...register("name", { required: "Give your product a title" })} placeholder="e.g. Vintage Camera" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" {...register("price", { required: true, min: 0 })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Quantity</Label>
              <Input id="stock" type="number" {...register("stock", { required: true, min: 1 })} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select 
              id="category"
              {...register("category", { required: "Select a category" })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description", { required: "Tell us more about the item" })} className="min-h-[100px]" />
          </div>

          <div className="grid gap-2">
            <Label>Pickup Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                ref={locationInputRef}
                className="pl-9"
                placeholder="Search for a location..."
                onChange={(e) => setLocationData({ ...locationData, address: e.target.value, lat: null, lng: null })}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation} disabled={locationLoading} className="w-fit gap-2">
              {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              Use current location
            </Button>
          </div>

          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <Label>Photos ({imageFiles.length}/5)</Label>
            </div>
            <div className="flex gap-3 overflow-x-auto py-2">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imageFiles.length < 5 && (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[10px] mt-1 text-muted-foreground">Add Photo</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="w-32">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "List Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewListingModal;