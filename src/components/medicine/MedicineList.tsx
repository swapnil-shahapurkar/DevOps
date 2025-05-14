
import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { MedicineForm } from "./MedicineForm";
import { useToast } from "../../hooks/use-toast";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Pencil, Trash2 } from "lucide-react";

export const MedicineList = () => {
  const { medicines, deleteMedicine } = useStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editMedicineId, setEditMedicineId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Register ScrollTrigger
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Animate medicine cards on scroll
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".medicine-card").forEach((card, i) => {
        gsap.fromTo(card, 
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: i * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top bottom-=100",
              toggleActions: "play none none none"
            }
          }
        );
      });
    });
    
    return () => ctx.revert();
  }, [medicines]);
  
  const handleEdit = (id: string) => {
    setEditMedicineId(id);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      deleteMedicine(id);
      toast({ title: "Success", description: "Medicine deleted successfully" });
    }
  };
  
  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.manufacturer && med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (med.category && med.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (med.shelfNumber && med.shelfNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Input
          placeholder="Search medicines..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="flex gap-2">
          <span className="text-muted-foreground">
            Total: {filteredMedicines.length} medicines
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map(medicine => (
            <Card 
              key={medicine.id} 
              className="medicine-card p-5 glass-card hover:border-medPurple transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{medicine.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {medicine.manufacturer || "No manufacturer"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(medicine.id)}
                    title="Edit medicine"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(medicine.id)}
                    title="Delete medicine"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">${medicine.price.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Stock</span>
                  <span className="font-medium">{medicine.stock} units</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{medicine.category || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Expiry</span>
                  <span className="font-medium">
                    {new Date(medicine.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {medicine.shelfNumber && (
                <div className="mt-3 bg-medPurple/10 px-3 py-2 rounded-md border border-medPurple/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Shelf Location:</span>
                    <span className="text-sm bg-medPurple/20 px-2 py-0.5 rounded font-mono">
                      {medicine.shelfNumber}
                    </span>
                  </div>
                </div>
              )}
              
              {medicine.description && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-sm text-muted-foreground">
                    {medicine.description}
                  </p>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground">No medicines found.</p>
          </div>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border-white/10 p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            {editMedicineId && (
              <MedicineForm 
                medicineId={editMedicineId} 
                onComplete={() => setIsDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
