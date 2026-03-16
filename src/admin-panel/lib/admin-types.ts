// Admin Panel Type Definitions

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string; // Added for admin signup
  photoURL?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  adminCreatedAt?: Date; // When admin privileges were granted
}

export type AdminPermission = 
  | 'manage_users'
  | 'manage_products'
  | 'manage_orders'
  | 'manage_gifts'
  | 'manage_transactions'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_admins';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalGiftOrders: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

// Allowed admin emails
export const ALLOWED_ADMIN_EMAILS = [
  "muhammednetr@gmail.com",
  "olamimuhammed2020@gmail.com",
  "smsglobe01@gmail.com"
];
