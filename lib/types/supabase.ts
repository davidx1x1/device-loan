// Supabase Database Types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'student' | 'staff';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'student' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'student' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
      };
      device_models: {
        Row: {
          id: string;
          brand: string;
          model: string;
          category: 'laptop' | 'tablet' | 'camera' | 'other';
          description: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      devices: {
        Row: {
          id: string;
          device_model_id: string;
          serial_number: string;
          is_available: boolean;
          condition: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          status: 'reserved' | 'collected' | 'returned' | 'cancelled';
          reserved_at: string;
          collected_at: string | null;
          due_date: string;
          returned_at: string | null;
          collected_by_staff_id: string | null;
          returned_to_staff_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          user_id: string;
          device_model_id: string;
          notified: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          correlation_id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };
    };
  };
};
