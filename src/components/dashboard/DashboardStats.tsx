
import { useEffect } from "react";
import { useStore } from "../../lib/store";
import { Card } from "../ui/card";
import { gsap } from "gsap";
import { Medicine } from "../../lib/types";
import { Pill, Archive, AlertCircle, Calendar } from "lucide-react";

export const DashboardStats = () => {
  const { medicines } = useStore();
  
  useEffect(() => {
    // Animate stats cards
    gsap.fromTo(
      ".stat-card",
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out"
      }
    );
  }, []);
  
  // Calculate total inventory value
  const totalInventoryValue = medicines.reduce(
    (sum, medicine) => sum + medicine.price * medicine.stock, 
    0
  );
  
  // Count low stock items (less than 10 units)
  const lowStockCount = medicines.filter(med => med.stock < 10).length;
  
  // Find medicines expiring soon (within next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const expiringSoonCount = medicines.filter(med => {
    const expiryDate = new Date(med.expiryDate);
    return expiryDate > today && expiryDate <= thirtyDaysFromNow;
  }).length;
  
  // Get most recent 5 medicines
  const recentMedicines = [...medicines]
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-medPurple-light/20">
              <Pill className="h-6 w-6 text-medPurple" />
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Total Medicines</h3>
              <p className="text-3xl font-bold mt-1">{medicines.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="stat-card p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-medPurple/20">
              <Archive className="h-6 w-6 text-medPurple" />
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Inventory Value</h3>
              <p className="text-3xl font-bold mt-1">${totalInventoryValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="stat-card p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-destructive/20">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Low Stock Items</h3>
              <p className="text-3xl font-bold mt-1">{lowStockCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="stat-card p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-medPurple-dark/20">
              <Calendar className="h-6 w-6 text-medPurple-dark" />
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">Expiring Soon</h3>
              <p className="text-3xl font-bold mt-1">{expiringSoonCount}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-4">Recently Added Medicines</h3>
          
          {recentMedicines.length > 0 ? (
            <div className="space-y-4">
              {recentMedicines.map(medicine => (
                <div key={medicine.id} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-medium">{medicine.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(medicine.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${medicine.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {medicine.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No medicines added yet
            </p>
          )}
        </Card>
        
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-4">Inventory Stats</h3>
          
          <div className="space-y-4">
            {/* Stock by category */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Stock by Category
              </h4>
              
              {getCategoryStats(medicines).map(category => (
                <div key={category.name} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{category.name}</span>
                    <span>{category.count} items</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-medPurple rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Helper function to get category statistics
function getCategoryStats(medicines: Medicine[]) {
  const categoryMap = new Map<string, number>();
  
  // Count medicines by category
  medicines.forEach(med => {
    const category = med.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  
  // Convert to array and calculate percentages
  const total = medicines.length || 1; // Avoid division by zero
  const stats = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: (count / total) * 100
  }));
  
  // Sort by count in descending order
  return stats.sort((a, b) => b.count - a.count);
}
