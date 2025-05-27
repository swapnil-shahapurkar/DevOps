
import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { MedicineList } from "../components/medicine/MedicineList";
import { MedicineForm } from "../components/medicine/MedicineForm";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { gsap } from "gsap";
import { Plus } from "lucide-react";

const Inventory = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  useEffect(() => {
    // Animate page elements
    gsap.from(".page-header", {
      opacity: 0,
      y: -20,
      duration: 0.6
    });
  }, []);
  
  return (
    <AppLayout title="Inventory Management">
      <div className="page-header flex justify-between items-center mb-8">
        <p className="text-muted-foreground">
          Manage your medicine inventory
        </p>
        
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-medPurple hover:bg-medPurple-dark text-white btn-pulse"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Medicine
        </Button>
      </div>
      
      <MedicineList />
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-background border-white/10 p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            <MedicineForm onComplete={() => setIsAddDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Inventory;
