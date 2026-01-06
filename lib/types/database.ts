// Database types matching Supabase schema

export type UserRole = 'student' | 'staff';
export type DeviceCategory = 'laptop' | 'tablet' | 'camera' | 'other';
export type LoanStatus = 'reserved' | 'collected' | 'returned' | 'cancelled';

export interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DeviceModel {
  id: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  device_model_id: string;
  serial_number: string;
  is_available: boolean;
  condition?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  device_id: string;
  status: LoanStatus;
  reserved_at: string;
  collected_at?: string;
  due_date: string;
  returned_at?: string;
  collected_by_staff_id?: string;
  returned_to_staff_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Waitlist {
  id: string;
  user_id: string;
  device_model_id: string;
  notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  correlation_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Extended types with joins
export interface DeviceWithModel extends Device {
  device_model: DeviceModel;
}

export interface LoanWithDetails extends Loan {
  user: User;
  device: DeviceWithModel;
}

export interface DeviceModelWithAvailability extends DeviceModel {
  available_count: number;
  total_count: number;
}
