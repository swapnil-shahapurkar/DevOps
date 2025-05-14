
// Medicine Model
export interface Medicine {
  id: string;
  name: string;
  manufacturer?: string;
  price: number;
  stock: number;
  expiryDate: string; // ISO Date string format
  category?: string;
  description?: string;
  shelfNumber?: string; // New field for shelf location
  createdAt: string; // ISO Date string format
  updatedAt: string; // ISO Date string format
}

// Bill Item model
export interface BillItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

// Bill model
export interface Bill {
  id: string;
  items: BillItem[];
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  date: string; // ISO Date string format
  discount?: number;
  finalAmount: number;
}
