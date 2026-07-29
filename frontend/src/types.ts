/**
 * Type definitions for the Expense Tracking System
 */

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  category_icon?: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  amount: string;
  description: string;
  category: string;
  date: string;
}

export interface MonthlySummary {
  totalExpenses: number;
  categoryBreakdown: CategoryBreakdown[];
  topCategories: TopCategory[];
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

export interface TopCategory {
  category: string;
  total: number;
  count: number;
}

export interface DayExpenses {
  day: number;
  expenses: Expense[];
  total: number;
}

export interface Category {
  id: number;
  name: string;
  is_default: boolean;
  icon?: string | null;
}