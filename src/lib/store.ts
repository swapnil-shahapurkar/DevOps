
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { Medicine, Bill, BillItem, DbMedicine, DbBill, DbBillItem } from "./types";
import { toast } from "../hooks/use-toast";

// Helpers for data conversion
const convertDbMedicineToMedicine = (dbMedicine: DbMedicine): Medicine => ({
  id: dbMedicine.id,
  name: dbMedicine.name,
  manufacturer: dbMedicine.manufacturer,
  price: dbMedicine.price,
  stock: dbMedicine.stock,
  expiryDate: dbMedicine.expiry_date,
  category: dbMedicine.category,
  description: dbMedicine.description,
  shelfNumber: dbMedicine.shelf_number,
  createdAt: dbMedicine.created_at,
  updatedAt: dbMedicine.updated_at
});

const convertMedicineToDbMedicine = (medicine: Partial<Medicine>): Partial<DbMedicine> => ({
  name: medicine.name,
  manufacturer: medicine.manufacturer,
  price: medicine.price,
  stock: medicine.stock,
  expiry_date: medicine.expiryDate,
  category: medicine.category,
  description: medicine.description,
  shelf_number: medicine.shelfNumber,
  updated_at: new Date().toISOString()
});

const convertDbBillToBill = async (dbBill: DbBill): Promise<Bill> => {
  // Fetch bill items for this bill
  const { data: dbBillItems, error } = await supabase
    .from('bill_items')
    .select('*')
    .eq('bill_id', dbBill.id);

  if (error) {
    console.error('Error fetching bill items:', error);
    throw error;
  }

  const items: BillItem[] = dbBillItems.map(item => ({
    id: item.id,
    medicineId: item.medicine_id,
    medicineName: item.medicine_name,
    quantity: item.quantity,
    pricePerUnit: item.price_per_unit,
    totalPrice: item.total_price,
    billId: item.bill_id
  }));

  return {
    id: dbBill.id,
    items,
    totalAmount: dbBill.total_amount,
    customerName: dbBill.customer_name,
    customerPhone: dbBill.customer_phone,
    date: dbBill.date,
    discount: dbBill.discount || 0,
    finalAmount: dbBill.final_amount
  };
};

interface StoreState {
  medicines: Medicine[];
  bills: Bill[];
  isLoading: {
    medicines: boolean;
    bills: boolean;
  };
  
  // Medicine actions
  fetchMedicines: () => Promise<Medicine[]>;
  addMedicine: (medicine: Omit<Medicine, "id" | "createdAt" | "updatedAt">) => Promise<Medicine>;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  getMedicine: (id: string) => Medicine | undefined;
  
  // Bill actions
  fetchBills: () => Promise<Bill[]>;
  createBill: (items: BillItem[], customerName?: string, customerPhone?: string, discount?: number) => Promise<Bill>;
}

export const useStore = create<StoreState>((set, get) => ({
  medicines: [],
  bills: [],
  isLoading: {
    medicines: false,
    bills: false
  },
  
  // Medicine actions
  fetchMedicines: async () => {
    set(state => ({ isLoading: { ...state.isLoading, medicines: true }}));
    
    try {
      const { data: dbMedicines, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching medicines:', error);
        toast({ 
          title: "Error fetching medicines", 
          description: error.message,
          variant: "destructive"
        });
        return get().medicines;
      }
      
      const medicines = dbMedicines.map(convertDbMedicineToMedicine);
      set({ medicines, isLoading: { ...get().isLoading, medicines: false }});
      return medicines;
    } catch (error) {
      console.error('Error in fetchMedicines:', error);
      set(state => ({ isLoading: { ...state.isLoading, medicines: false }}));
      return get().medicines;
    }
  },
  
  addMedicine: async (medicine) => {
    try {
      const medicineToInsert = {
        name: medicine.name,
        manufacturer: medicine.manufacturer,
        price: medicine.price,
        stock: medicine.stock,
        expiry_date: medicine.expiryDate,
        category: medicine.category,
        description: medicine.description,
        shelf_number: medicine.shelfNumber
      };
      
      const { data: inserted, error } = await supabase
        .from('medicines')
        .insert(medicineToInsert)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding medicine:', error);
        toast({ 
          title: "Error adding medicine", 
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      const newMedicine = convertDbMedicineToMedicine(inserted);
      set(state => ({ medicines: [...state.medicines, newMedicine] }));
      return newMedicine;
    } catch (error) {
      console.error('Error in addMedicine:', error);
      throw error;
    }
  },
  
  updateMedicine: async (id, medicine) => {
    try {
      const updates = convertMedicineToDbMedicine(medicine);
      
      const { error } = await supabase
        .from('medicines')
        .update(updates)
        .eq('id', id);
        
      if (error) {
        console.error('Error updating medicine:', error);
        toast({ 
          title: "Error updating medicine", 
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      // Fetch the updated medicine to ensure we have the latest data
      const { data: updated, error: fetchError } = await supabase
        .from('medicines')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated medicine:', fetchError);
        throw fetchError;
      }
      
      const updatedMedicine = convertDbMedicineToMedicine(updated);
      set(state => ({
        medicines: state.medicines.map(med => 
          med.id === id ? updatedMedicine : med
        )
      }));
    } catch (error) {
      console.error('Error in updateMedicine:', error);
      throw error;
    }
  },
  
  deleteMedicine: async (id) => {
    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting medicine:', error);
        toast({ 
          title: "Error deleting medicine", 
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      set(state => ({
        medicines: state.medicines.filter(med => med.id !== id)
      }));
    } catch (error) {
      console.error('Error in deleteMedicine:', error);
      throw error;
    }
  },
  
  getMedicine: (id) => {
    return get().medicines.find(med => med.id === id);
  },
  
  // Bill actions
  fetchBills: async () => {
    set(state => ({ isLoading: { ...state.isLoading, bills: true }}));
    
    try {
      const { data: dbBills, error } = await supabase
        .from('bills')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        console.error('Error fetching bills:', error);
        toast({ 
          title: "Error fetching bills", 
          description: error.message,
          variant: "destructive"
        });
        return get().bills;
      }
      
      const billPromises = dbBills.map(convertDbBillToBill);
      const bills = await Promise.all(billPromises);
      
      set({ bills, isLoading: { ...get().isLoading, bills: false }});
      return bills;
    } catch (error) {
      console.error('Error in fetchBills:', error);
      set(state => ({ isLoading: { ...state.isLoading, bills: false }}));
      return get().bills;
    }
  },
  
  createBill: async (items, customerName, customerPhone, discount = 0) => {
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const finalAmount = totalAmount - discount;
      
      // 1. Create bill record
      const { data: insertedBill, error: billError } = await supabase
        .from('bills')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: totalAmount,
          discount,
          final_amount: finalAmount
        })
        .select()
        .single();
        
      if (billError) {
        console.error('Error creating bill:', billError);
        toast({ 
          title: "Error creating bill", 
          description: billError.message,
          variant: "destructive"
        });
        throw billError;
      }
      
      // 2. Create bill items
      const billItems = items.map(item => ({
        bill_id: insertedBill.id,
        medicine_id: item.medicineId,
        medicine_name: item.medicineName,
        quantity: item.quantity,
        price_per_unit: item.pricePerUnit,
        total_price: item.totalPrice
      }));
      
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);
        
      if (itemsError) {
        console.error('Error creating bill items:', itemsError);
        toast({ 
          title: "Error creating bill items", 
          description: itemsError.message,
          variant: "destructive"
        });
        throw itemsError;
      }
      
      // 3. Update medicine stock quantities
      for (const item of items) {
        const medicine = get().medicines.find(m => m.id === item.medicineId);
        if (medicine) {
          await get().updateMedicine(medicine.id, {
            stock: medicine.stock - item.quantity
          });
        }
      }
      
      // 4. Create the new bill object with items
      const newBill: Bill = {
        id: insertedBill.id,
        items: items.map(item => ({
          ...item,
          billId: insertedBill.id,
        })),
        totalAmount,
        customerName,
        customerPhone,
        date: insertedBill.date,
        discount,
        finalAmount
      };
      
      set(state => ({
        bills: [newBill, ...state.bills]
      }));
      
      return newBill;
    } catch (error) {
      console.error('Error in createBill:', error);
      throw error;
    }
  }
}));
