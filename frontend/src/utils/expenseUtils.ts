/**
 * Utility functions for expense calculations and data manipulation
 */

import { Expense } from "../types";

/**
 * Calculate total amount from an array of expenses
 */
export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Group expenses by day
 */
export function groupExpensesByDay(expenses: Expense[]) {
  const grouped = new Map<number, Expense[]>();

  expenses.forEach((expense) => {
    const day = new Date(expense.date).getDate();
    const dayExpenses = grouped.get(day) || [];
    dayExpenses.push(expense);
    grouped.set(day, dayExpenses);
  });

  return grouped;
}
