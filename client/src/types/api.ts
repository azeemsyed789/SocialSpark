// Frontend types for API responses
import type { User, Account as DBAccount, Organization } from '@shared/schema';
import type { DashboardMetrics, PlatformMetrics, MarketFitBreakdown } from '../../../server/services/analytics';

// Re-export types for convenience
export type Account = DBAccount & { features?: string };
export type { User, Organization };

// Demo account type for display purposes
export interface DemoAccount {
  id: string;
  platform: string;
  handle: string;
  status: string;
  healthStatus: string;
  lastHealthCheck: string | null;
  features?: string;
}

// Union type for accounts that could be from DB or demo
export type DisplayAccount = Account | DemoAccount;

// User types with organization info
export interface AuthUser extends User {
  organization?: Organization;
}

// API response types
export interface DashboardMetricsResponse extends DashboardMetrics {}
export interface AccountsResponse extends Array<Account> {}
export interface PlatformMetricsResponse extends Array<PlatformMetrics> {}
export interface MarketFitResponse extends MarketFitBreakdown {}

// Error response type
export interface ApiError {
  message: string;
  status?: number;
}