import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Plus, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const NewListingModal = ({ onProductAdded }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: "You can upload up to 5 images."
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValidType) toast({ variant: "destructive", title: "Invalid file type", description: `${file.name} is not a supported image.` });
      if (!isValidSize) toast({ variant: "destructive", title: "File too large", description: `${file.name} exceeds 5MB.` });
      return isValidType && isValidSize;
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

  const onSubmit = async (data) => {
    if (imageFiles.length === 0) {
      toast({ variant: "destructive", title: "Missing image", description: "Please upload at least one product image." });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("jwt_token");
      const formData = new FormData();

      // Build product object from form data
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        category: data.category,
        // Optional: include currency if needed (backend sets default)
        // currency: "USD"
      };

      // Append product JSON as a single string part
      formData.append("product", JSON.stringify(productData));

      // Append each image file
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Content-Type is omitted so browser sets multipart boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create listing");
      }

      const savedProduct = await response.json();
      onProductAdded(savedProduct);

      toast({ title: "Success!", description: "Product listed successfully." });

      // Clean up preview URLs
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      reset();
      setImageFiles([]);
      setImagePreviews([]);
      setOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up previews when modal closes without submit
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviews([]);
      reset();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="marketplace-gradient border-0 text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <Plus className="w-4 h-4 mr-2" /> New Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-131.25">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create New Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Product Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="e.g. Hand-painted Tea Bowl"
              {...register("name", { required: "Product name is required" })}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("price", { required: "Price is required", min: 0 })}
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Initial Stock</Label>
              <Input
                id="stock"
                type="number"
                placeholder="10"
                {...register("stock", { required: "Stock is required", min: 0 })}
              />
              {errors.stock && <p className="text-sm text-red-500">{errors.stock.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              placeholder="Tell buyers about the materials, process, and dimensions..."
              className="min-h-25"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {/* Category Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register("category", { required: "Please select a category" })}
            >
              <option value="">Select a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home&Garden">Home & Garden</option>
              <option value="Art&Crafts">Art & Crafts</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Vintage">Vintage</option>
              <option value="Sports">Sports</option>
              <option value="Books">Books</option>
            </select>
            {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
          </div>

          {/* Image Upload Section */}
          <div className="grid gap-2">
            <Label>Product Images (up to 5)</Label>
            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                  <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">Add Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={imageFiles.length >= 5}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: JPEG, PNG, WEBP. Max size: 5MB each.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-30">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewListingModal;
