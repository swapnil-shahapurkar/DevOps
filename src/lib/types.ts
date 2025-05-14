
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
  shelfNumber?: string; // Field for shelf location
  createdAt: string; // ISO Date string format
  updatedAt: string; // ISO Date string format
}

// Bill Item model
export interface BillItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  billId?: string;
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

// Database types (camelCase to snake_case conversion)
export interface DbMedicine {
  id: string;
  name: string;
  manufacturer?: string;
  price: number;
  stock: number;
  expiry_date: string;
  category?: string;
  description?: string;
  shelf_number?: string;
  created_at: string;
  updated_at: string;
}

export interface DbBillItem {
  id: string;
  bill_id: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

export interface DbBill {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  date: string;
  total_amount: number;
  discount?: number;
  final_amount: number;
}
