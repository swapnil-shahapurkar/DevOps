
import { useState, useEffect } from "react";
import { useStore } from "../../lib/store";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { gsap } from "gsap";
import { Loader2 } from "lucide-react";

interface MedicineFormProps {
  medicineId?: string;
  onComplete?: () => void;
}

export const MedicineForm = ({ medicineId, onComplete }: MedicineFormProps) => {
  const { toast } = useToast();
  const { addMedicine, updateMedicine, getMedicine } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    manufacturer: string;
    price: string;
    stock: string;
    expiryDate: string;
    category: string;
    description: string;
    shelfNumber: string;
  }>({
    name: "",
    manufacturer: "",
    price: "",
    stock: "",
    expiryDate: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    shelfNumber: ""
  });

  // Load medicine data if editing
  useEffect(() => {
    if (medicineId) {
      const medicine = getMedicine(medicineId);
      if (medicine) {
        setFormData({
          name: medicine.name,
          manufacturer: medicine.manufacturer || "",
          price: medicine.price.toString(),
          stock: medicine.stock.toString(),
          expiryDate: new Date(medicine.expiryDate).toISOString().split("T")[0],
          category: medicine.category || "",
          description: medicine.description || "",
          shelfNumber: medicine.shelfNumber || ""
        });
      }
    }
  }, [medicineId, getMedicine]);

  // Animate form on mount
  useEffect(() => {
    gsap.fromTo(
      ".form-field",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, ease: "power2.out" }
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Form validation
      if (!formData.name.trim()) {
        toast({ title: "Error", description: "Medicine name is required", variant: "destructive" });
        return;
      }
      
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        toast({ title: "Error", description: "Please enter a valid price", variant: "destructive" });
        return;
      }
      
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        toast({ title: "Error", description: "Stock cannot be negative", variant: "destructive" });
        return;
      }
      
      const medicineData = {
        name: formData.name,
        manufacturer: formData.manufacturer,
        price,
        stock,
        expiryDate: new Date(formData.expiryDate).toISOString(),
        category: formData.category,
        description: formData.description,
        shelfNumber: formData.shelfNumber
      };
      
      if (medicineId) {
        await updateMedicine(medicineId, medicineData);
        toast({ title: "Success", description: "Medicine updated successfully" });
      } else {
        await addMedicine(medicineData);
        toast({ title: "Success", description: "Medicine added successfully" });
      }
      
      // Reset form or close modal
      if (!medicineId) {
        setFormData({
          name: "",
          manufacturer: "",
          price: "",
          stock: "",
          expiryDate: new Date().toISOString().split("T")[0],
          category: "",
          description: "",
          shelfNumber: ""
        });
      }
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: "An error occurred while saving medicine",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 glass-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-field">
          <label className="block mb-1 text-sm font-medium">
            Medicine Name*
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter medicine name"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-field">
          <label className="block mb-1 text-sm font-medium">
            Manufacturer
          </label>
          <Input
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            placeholder="Enter manufacturer name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <label className="block mb-1 text-sm font-medium">
              Price*
            </label>
            <Input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-field">
            <label className="block mb-1 text-sm font-medium">
              Stock Quantity*
            </label>
            <Input
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <label className="block mb-1 text-sm font-medium">
              Expiry Date*
            </label>
            <Input
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-field">
            <label className="block mb-1 text-sm font-medium">
              Category
            </label>
            <Input
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Enter category"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="form-field">
          <label className="block mb-1 text-sm font-medium">
            Shelf Number
          </label>
          <Input
            name="shelfNumber"
            value={formData.shelfNumber}
            onChange={handleChange}
            placeholder="Enter shelf location (e.g. A1, B3)"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-field">
          <label className="block mb-1 text-sm font-medium">
            Description
          </label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-field">
          <Button 
            type="submit" 
            className="bg-medPurple hover:bg-medPurple-dark text-white w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {medicineId ? "Updating..." : "Adding..."}
              </>
            ) : (
              medicineId ? "Update Medicine" : "Add Medicine"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
