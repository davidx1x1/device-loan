// API request and response types
import { DeviceCategory, UserRole, LoanStatus } from './database';

// Common API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    correlation_id: string;
    timestamp: string;
  };
}

// Device API types
export interface DeviceListResponse {
  id: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  description?: string;
  image_url?: string;
  available_count: number;
  total_count: number;
}

// Reservation API types
export interface CreateReservationRequest {
  device_model_id: string;
}

export interface CreateReservationResponse {
  loan_id: string;
  device_id: string;
  device_model: {
    brand: string;
    model: string;
  };
  reserved_at: string;
  due_date: string;
  status: LoanStatus;
}

// Waitlist API types
export interface SubscribeWaitlistRequest {
  device_model_id: string;
}

export interface WaitlistSubscription {
  id: string;
  device_model: {
    brand: string;
    model: string;
  };
  created_at: string;
}

// Staff API types
export interface MarkCollectedRequest {
  loan_id: string;
}

export interface MarkReturnedRequest {
  loan_id: string;
}

export interface LoanActionResponse {
  loan_id: string;
  status: LoanStatus;
  timestamp: string;
}

// User session type (from Auth0)
export interface UserSession {
  user: {
    sub: string; // Auth0 user ID
    email: string;
    name: string;
    [key: string]: unknown;
  };
  role?: UserRole;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latency_ms?: number;
    };
    auth: {
      status: 'up' | 'down';
    };
  };
}

export interface ReadinessCheckResponse {
  ready: boolean;
  timestamp: string;
}
