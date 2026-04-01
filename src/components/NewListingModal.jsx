import React from "react";
import { useForm } from "react-hook-form";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const NewListingModal = ({ onProductAdded }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); 

      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        images: [data.imageUrl || "https://images.unsplash.com/photo-1581783898377-1c85bf937427"], // Fallback
        rating: 5.0,
        reviewCount: 0,
        seller: { name: "Kyoto Ceramics", location: "Kyoto, JP" }
      };

      onProductAdded(newProduct);
      toast({ title: "Listing Created!", description: `${data.name} is now live.` });
      
      reset();
      setOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save listing." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" placeholder="e.g. Hand-painted Tea Bowl" {...register("name", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" placeholder="0.00" {...register("price", { required: true })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Initial Stock</Label>
              <Input id="stock" type="number" placeholder="10" {...register("stock", { required: true })} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea 
              id="description" 
              placeholder="Tell buyers about the materials, process, and dimensions..." 
              className="min-h-25"
              {...register("description", { required: true })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="imageUrl">Image URL (Direct Link)</Label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input id="imageUrl" className="pl-10" placeholder="https://..." {...register("imageUrl")} />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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