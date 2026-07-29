# Bug Reports and Feature Requests

## BUG-001: New Expenses Not Appearing at Top of List

## 📝 Summary

When adding a new expense, it doesn't appear at the top of the expense list. Expenses should be ordered by their expense date (descending) rather than creation timestamp to ensure the most recent expenses appear first.

### 🔍 Actual Behavior

When a new expense is created, it appears somewhere in the middle or bottom of the expense list instead of at the top, making it difficult for users to verify their newly added expense.

### 🎯 Expected Behavior

Newly added expenses should appear at the top of the expense table, ordered by their expense date in descending order (most recent dates first).

### 🎬 Steps to Reproduce

1. Go to the Expense History page
2. Click on 'Add Expense' button
3. Fill in the form with today's date and submit
4. Observe the expense list after the page reloads
5. Notice the new expense is not at the top of the list

---

## FEATURE-001: Add Category Management Feature

## 📝 Summary

Implement the ability to create new expense categories dynamically through the UI, allowing users to customize categories beyond the predefined list.

### 🔍 Actual Behavior

Users can only select from a predefined list of expense categories. There is no way to add custom categories.

### 🎯 Expected Behavior

Users should be able to create new categories through the UI with the following features:

1. An "Add Category" button in a prominent location
2. A modal dialog to input new category details
3. Backend endpoint to persist the new category
4. Updated category list after creation

### 🎬 Steps to Reproduce

N/A - Feature doesn't exist yet

---

## BONUS-001: Prevent Future Date Expense Creation

## 📝 Summary

Add validation to prevent users from creating expenses with dates in the future. Users should only be able to add expenses for today or past dates.

### 🔍 Actual Behavior

Users can select any date in the future when creating an expense, which doesn't make sense for expense tracking (you can't have spent money on a future date).

### 🎯 Expected Behavior

The date picker in the expense form should:

1. Prevent selection of future dates
2. Default to today's date
3. Show a validation error if user manually enters a future date
4. Display a helpful error message explaining the restriction

### 🎬 Steps to Reproduce

N/A - Feature doesn't exist yet
