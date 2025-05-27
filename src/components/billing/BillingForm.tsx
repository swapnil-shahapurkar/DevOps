
import { useState, useEffect } from "react";
import { useStore } from "../../lib/store";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";
import { gsap } from "gsap";
import { BillItem } from "../../lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Trash2, Printer } from "lucide-react";
import { Bill } from "../../lib/types";

export const BillingForm = () => {
  const { toast } = useToast();
  const { medicines, createBill } = useStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  
  useEffect(() => {
    // Animate form fields on mount
    gsap.fromTo(
      ".billing-field", 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, stagger: 0.1, ease: "power2.out" }
    );
  }, []);
  
  const filteredMedicines = medicines.filter(med => 
    med.stock > 0 && med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddMedicine = (medicineId: string) => {
    const medicine = medicines.find(med => med.id === medicineId);
    if (!medicine) return;
    
    const existingItem = selectedMedicines.find(item => item.medicineId === medicineId);
    
    if (existingItem) {
      // Update quantity if medicine already in cart
      if (existingItem.quantity >= medicine.stock) {
        toast({ 
          title: "Error", 
          description: "Cannot add more units than available in stock", 
          variant: "destructive" 
        });
        return;
      }
      
      const updatedItems = selectedMedicines.map(item => 
        item.medicineId === medicineId 
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * item.pricePerUnit
            } 
          : item
      );
      setSelectedMedicines(updatedItems);
    } else {
      // Add new medicine to cart
      setSelectedMedicines([
        ...selectedMedicines, 
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          quantity: 1,
          pricePerUnit: medicine.price,
          totalPrice: medicine.price
        }
      ]);
    }
  };
  
  const handleUpdateQuantity = (medicineId: string, quantity: number) => {
    const medicine = medicines.find(med => med.id === medicineId);
    if (!medicine) return;
    
    if (quantity <= 0) {
      handleRemoveMedicine(medicineId);
      return;
    }
    
    if (quantity > medicine.stock) {
      toast({ 
        title: "Error", 
        description: "Quantity cannot exceed available stock", 
        variant: "destructive" 
      });
      return;
    }
    
    const updatedItems = selectedMedicines.map(item => 
      item.medicineId === medicineId 
        ? { 
            ...item, 
            quantity,
            totalPrice: quantity * item.pricePerUnit
          } 
        : item
    );
    setSelectedMedicines(updatedItems);
  };
  
  const handleRemoveMedicine = (medicineId: string) => {
    setSelectedMedicines(selectedMedicines.filter(item => item.medicineId !== medicineId));
  };
  
  const calculateSubtotal = () => {
    return selectedMedicines.reduce((sum, item) => sum + item.totalPrice, 0);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() - (discount || 0);
  };
  
  const handleGenerateBill = async () => {
    if (selectedMedicines.length === 0) {
      toast({ 
        title: "Error", 
        description: "Please add at least one medicine to the bill", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const bill = await createBill(
        selectedMedicines, 
        customerName || "Customer", 
        customerPhone, 
        discount
      );
      
      // Verify bill has the required properties before setting state
      if (!bill || !bill.items) {
        throw new Error("Generated bill is missing required data");
      }
      
      setGeneratedBill(bill);
      setShowBillPreview(true);
      
      // Reset form
      resetForm();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to generate bill", 
        variant: "destructive" 
      });
      console.error(error);
    }
  };
  
  const resetForm = () => {
    setSelectedMedicines([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
  };
  
  const handlePrintBill = () => {
    if (!generatedBill || !generatedBill.items) {
      toast({ 
        title: "Error", 
        description: "Bill data is incomplete or missing", 
        variant: "destructive" 
      });
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ 
        title: "Error", 
        description: "Could not open print window", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const billDate = new Date(generatedBill.date).toLocaleDateString();
      
      const billContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medical Bill</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .bill-header { text-align: center; margin-bottom: 20px; }
            .bill-header h2 { margin: 0; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total-section { margin-top: 20px; text-align: right; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="bill-header">
            <h2>Med Vault Pharmacy</h2>
            <p>123 Medical Street, Health City</p>
            <p>Phone: (123) 456-7890</p>
          </div>
          
          <div class="customer-info">
            <p><strong>Bill ID:</strong> ${generatedBill.id}</p>
            <p><strong>Date:</strong> ${billDate}</p>
            <p><strong>Customer:</strong> ${generatedBill.customerName || 'Customer'}</p>
            ${generatedBill.customerPhone ? `<p><strong>Phone:</strong> ${generatedBill.customerPhone}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${generatedBill.items.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.medicineName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.pricePerUnit.toFixed(2)}</td>
                  <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <p><strong>Subtotal:</strong> $${generatedBill.totalAmount.toFixed(2)}</p>
            ${generatedBill.discount ? `<p><strong>Discount:</strong> $${generatedBill.discount.toFixed(2)}</p>` : ''}
            <h3>Total: $${generatedBill.finalAmount.toFixed(2)}</h3>
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(billContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error) {
      console.error('Error generating bill print view:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate bill print view", 
        variant: "destructive" 
      });
      printWindow.close();
    }
  };
  
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicine Selection Area */}
        <div className="lg:col-span-2">
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Select Medicines</h3>
            
            <div className="billing-field mb-6">
              <Input
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="billing-field">
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map(medicine => (
                      <Card 
                        key={medicine.id} 
                        className="p-4 hover:border-medPurple transition-all cursor-pointer"
                        onClick={() => handleAddMedicine(medicine.id)}
                      >
                        <div>
                          <h4 className="font-medium">{medicine.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-muted-foreground">
                              Stock: {medicine.stock}
                            </span>
                            <span className="font-semibold">
                              ${medicine.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center p-4">
                      <p className="text-muted-foreground">No medicines found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </Card>
        </div>
        
        {/* Bill Summary Area */}
        <div>
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Bill Summary</h3>
            
            <div className="space-y-4">
              <div className="billing-field">
                <label className="block mb-1 text-sm">Customer Name</label>
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              
              <div className="billing-field">
                <label className="block mb-1 text-sm">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
            
            <div className="my-6">
              <h4 className="font-semibold mb-3">Selected Items</h4>
              
              {selectedMedicines.length > 0 ? (
                <div className="space-y-3">
                  {selectedMedicines.map(item => (
                    <div key={item.medicineId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.medicineName}</p>
                        <div className="flex items-center mt-1">
                          <button 
                            className="w-6 h-6 flex items-center justify-center rounded bg-secondary"
                            onClick={() => handleUpdateQuantity(item.medicineId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="mx-2 text-sm">{item.quantity}</span>
                          <button 
                            className="w-6 h-6 flex items-center justify-center rounded bg-secondary"
                            onClick={() => handleUpdateQuantity(item.medicineId, item.quantity + 1)}
                          >
                            +
                          </button>
                          <span className="ml-3 text-sm text-muted-foreground">
                            ${item.pricePerUnit.toFixed(2)} each
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-3">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveMedicine(item.medicineId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-3">
                  No items added
                </p>
              )}
            </div>
            
            <div className="billing-field pt-4 border-t border-white/10">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm">Discount:</label>
                <Input
                  type="number"
                  min="0"
                  max={calculateSubtotal()}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 text-right"
                />
              </div>
              
              <div className="flex justify-between mt-4 text-lg font-bold">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="billing-field mt-6">
              <Button 
                onClick={handleGenerateBill} 
                className="w-full bg-medPurple hover:bg-medPurple-dark"
                disabled={selectedMedicines.length === 0}
              >
                Generate Bill
              </Button>
            </div>
          </Card>
        </div>
      </div>
    
      {/* Bill Preview Dialog */}
      <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
        <DialogContent className="bg-background border-white/10">
          <DialogHeader>
            <DialogTitle>Bill Preview</DialogTitle>
          </DialogHeader>
          
          {generatedBill && generatedBill.items ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Med Vault Pharmacy</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(generatedBill.date).toLocaleString()}
                </p>
              </div>
              
              <div>
                <p><strong>Customer:</strong> {generatedBill.customerName || 'Customer'}</p>
                {generatedBill.customerPhone && (
                  <p><strong>Phone:</strong> {generatedBill.customerPhone}</p>
                )}
              </div>
              
              <div className="border border-white/10 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-4 py-2">Item</th>
                      <th className="text-center px-4 py-2">Qty</th>
                      <th className="text-center px-4 py-2">Price</th>
                      <th className="text-right px-4 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedBill.items.map((item: any) => (
                      <tr key={item.medicineId} className="border-t border-white/10">
                        <td className="px-4 py-2">{item.medicineName}</td>
                        <td className="text-center px-4 py-2">{item.quantity}</td>
                        <td className="text-center px-4 py-2">${item.pricePerUnit.toFixed(2)}</td>
                        <td className="text-right px-4 py-2">${item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="space-y-1 text-right">
                <p>Subtotal: ${generatedBill.totalAmount.toFixed(2)}</p>
                {generatedBill.discount > 0 && (
                  <p>Discount: ${generatedBill.discount.toFixed(2)}</p>
                )}
                <p className="text-xl font-bold">
                  Total: ${generatedBill.finalAmount.toFixed(2)}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handlePrintBill} className="flex gap-2">
                  <Printer className="h-4 w-4" />
                  Print Bill
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">Bill data is incomplete or missing</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
