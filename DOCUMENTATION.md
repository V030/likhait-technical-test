# Expense System — Complete Developer Documentation

> A full-stack expense tracking application built with Rails 7.2 API + React 18 + TypeScript + MySQL 8.0 + Docker.

---

## Table of Contents

- [SECTION 1 — High-Level Architecture](#section-1--high-level-architecture)
- [SECTION 2 — Rails Folder Structure](#section-2--rails-folder-structure)
- [SECTION 3 — Frontend Architecture](#section-3--frontend-architecture)
- [SECTION 4 — Request Lifecycle: Adding an Expense](#section-4--request-lifecycle-adding-an-expense)
- [SECTION 5 — Reverse Lifecycle: Loading Expenses](#section-5--reverse-lifecycle-loading-expenses)
- [SECTION 6 — Delete Expense Lifecycle](#section-6--delete-expense-lifecycle)
- [SECTION 7 — Edit Expense Lifecycle](#section-7--edit-expense-lifecycle)
- [SECTION 8 — Ruby Language Guide](#section-8--ruby-language-guide)
- [SECTION 9 — Rails Magic](#section-9--rails-magic)
- [SECTION 10 — Database](#section-10--database)
- [SECTION 11 — API Documentation](#section-11--api-documentation)
- [SECTION 12 — Data Flow Diagrams](#section-12--data-flow-diagrams)
- [SECTION 13 — Docker](#section-13--docker)
- [SECTION 14 — Development Workflow](#section-14--development-workflow)
- [SECTION 15 — Rails vs Express](#section-15--rails-vs-express)
- [SECTION 16 — Hidden Things](#section-16--hidden-things)
- [SECTION 17 — Technical Debt](#section-17--technical-debt)

---

# SECTION 1 — High-Level Architecture

## The Big Picture

This is a **monorepo** containing two completely independent applications that talk to each other over HTTP:

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR BROWSER                            │
│                                                                 │
│  React App (Vite dev server on port 5173)                       │
│    │                                                             │
│    │ fetch("http://localhost:3000/api/expenses")                 │
│    │                                                             │
└────┼────────────────────────────────────────────────────────────┘
     │
     │  HTTP Request (JSON body)
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RAILS API SERVER                              │
│                   (port 3000)                                   │
│                                                                 │
│  routes.rb         →  Which controller?                         │
│  Controller        →  What logic?                               │
│  Model (ActiveRecord) →  What SQL?                              │
│                                                                 │
└────┼────────────────────────────────────────────────────────────┘
     │
     │  SQL Queries
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MySQL 8.0 DATABASE                            │
│                   (port 3306)                                   │
│                                                                 │
│  categories table     expenses table                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Differences from Express.js

In Express.js, you typically have ONE server (Node) that handles both serving the frontend and the API. In this project:

| Concern | Express.js (typical) | This Project |
|---|---|---|
| Frontend server | Same Express server serves static files OR a framework like Next.js handles it | **Separate Vite dev server** on port 5173 |
| Backend server | Express app on one port | **Rails API** on port 3000 |
| Database | PostgreSQL via Prisma/Sequelize | **MySQL 8.0** via ActiveRecord |
| ORM | Prisma/Sequelize (JS) | **ActiveRecord** (Ruby) |
| Dev process | `npm run dev` starts everything | **Two separate terminals** or Docker |

## How They Communicate

The frontend makes **fetch()** calls to `http://localhost:3000/api/...`. The backend has **CORS** configured to accept these cross-origin requests (`config/initializers/cors.rb`).

In Express.js, you would write `app.use(cors())` — in Rails, it is done with the `rack-cors` gem configured in an initializer file.

---

# SECTION 2 — Rails Folder Structure

## Backend Directory Tree

```
backend/
├── app/                    ← YOUR APPLICATION CODE
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   └── api/
│   │       ├── categories_controller.rb
│   │       └── expenses_controller.rb
│   └── models/
│       ├── application_record.rb
│       ├── category.rb
│       └── expense.rb
├── config/                 ← CONFIGURATION
│   ├── application.rb
│   ├── database.yml
│   ├── routes.rb
│   ├── environments/
│   └── initializers/
│       ├── cors.rb
│       └── ...
├── db/                     ← DATABASE
│   ├── migrate/
│   │   ├── 20260218000001_create_categories.rb
│   │   └── 20260218000002_create_expenses.rb
│   ├── schema.rb
│   └── seeds.rb
├── spec/                   ← TESTS
│   ├── factories/
│   ├── models/
│   ├── requests/
│   ├── rails_helper.rb
│   └── spec_helper.rb
├── Gemfile                 ← DEPENDENCIES (like package.json)
├── Gemfile.lock            ← LOCKED DEPENDENCIES (like package-lock.json)
└── Dockerfile
```

## Folder-by-Folder Comparison to Express.js

### `app/controllers/` — Route Handlers

**Rails equivalent of Express route handlers.**

In Express:
```javascript
// Express: one file, one route definition
router.post('/api/expenses', async (req, res) => {
  const expense = await Expense.create(req.body);
  res.status(201).json(expense);
});
```

In Rails (`backend/app/controllers/api/expenses_controller.rb`):
```ruby
class Api::ExpensesController < ApplicationController
  def create
    expense = Expense.new(expense_params)
    if expense.save
      render json: format_expense(expense), status: :created
    else
      render json: { errors: expense.errors.full_messages },
             status: :unprocessable_entity
    end
  end

  private

  def expense_params
    params.require(:expense).permit(:description, :amount, :category_id, :date)
  end
end
```

**Key difference:** In Express, you define each route explicitly (`router.get`, `router.post`). In Rails, the **method name inside the controller** becomes the endpoint. The route mapping is defined in `config/routes.rb`:

```ruby
# backend/config/routes.rb
namespace :api do
  resources :expenses, only: [ :index, :create, :update, :destroy ]
end
```

This single line generates FOUR routes automatically:
| HTTP Method | URL | Controller#Action |
|---|---|---|
| GET | `/api/expenses` | `api/expenses#index` |
| POST | `/api/expenses` | `api/expenses#create` |
| PUT | `/api/expenses/:id` | `api/expenses#update` |
| DELETE | `/api/expenses/:id` | `api/expenses#destroy` |

In Express, you would need to write each `router.get()`, `router.post()`, etc. separately.

### `app/models/` — ORM Models

**Rails equivalent of Prisma/Sequelize models.**

In Express with Prisma:
```javascript
// Prisma schema
model Expense {
  id          Int      @id @default(autoincrement())
  description String
  amount      Decimal
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  Int
}
```

In Rails (`backend/app/models/expense.rb`):
```ruby
class Expense < ApplicationRecord
  belongs_to :category
end
```

That is the ENTIRE model file. Rails models are extremely minimal because **ActiveRecord infers everything from the database schema**. The table columns, types, and relationships are all read from the database itself — you do not define them in the model.

The counterpart (`backend/app/models/category.rb`):
```ruby
class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy
end
```

### `config/routes.rb` — URL Routing

**Rails equivalent of Express Router.**

```ruby
Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :categories, only: [ :index ]
    resources :expenses, only: [ :index, :create, :update, :destroy ]
  end
end
```

This is like Express:
```javascript
const router = express.Router();
router.get('/api/categories', categoriesController.index);
router.get('/api/expenses', expensesController.index);
router.post('/api/expenses', expensesController.create);
router.put('/api/expenses/:id', expensesController.update);
router.delete('/api/expenses/:id', expensesController.destroy);
```

The `namespace :api` wraps all routes under `/api/`. The `resources :expenses, only: [...]` limits which CRUD actions are generated (no `show` endpoint).

### `config/database.yml` — Database Connection

**Rails equivalent of your `.env` DATABASE_URL or Prisma datasource.**

```yaml
default: &default
  adapter: mysql2
  encoding: utf8mb4
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  host: <%= ENV.fetch("DATABASE_HOST") { "localhost" } %>
  username: <%= ENV.fetch("DATABASE_USERNAME") { "root" } %>
  password: <%= ENV.fetch("DATABASE_PASSWORD") { "" } %>
  database: <%= ENV.fetch("DATABASE_NAME") { "expense_system_development" } %>
```

This uses Ruby's ERB (Embedded Ruby) — similar to template literals in JS. It reads environment variables with fallback defaults. The `&default` and `<<: *default` syntax is YAML inheritance (like spread operator `...default` in JS objects).

### `Gemfile` — Dependencies

**Rails equivalent of `package.json`.**

```ruby
source "https://rubygems.org"
ruby "3.3.7"

gem "rails", "~> 7.2.2"
gem "mysql2", "~> 0.5"
gem "puma", ">= 5.0"
gem "rack-cors"

group :development, :test do
  gem "debug"
  gem "rubocop-rails-omakase"
  gem "rspec-rails", "~> 6.1.0"
  gem "factory_bot_rails"
  gem "faker"
end

group :test do
  gem "database_cleaner-active_record"
  gem "shoulda-matchers", "~> 6.0"
end
```

Key differences from npm:
- `gem "name"` = `"name": "version"` in package.json
- `group :test do` = `"devDependencies"` in package.json
- `bundle install` = `npm install`
- `bundle exec rspec` = `npx jest` (runs test executable from installed deps)

### `spec/` — Tests

**Rails equivalent of `__tests__/` or `*.test.js` files.**

This project uses **RSpec** (not Rails' built-in Minitest). RSpec is like Jest — it provides `describe`, `it`, `expect` blocks.

```
spec/
├── factories/              ← Test data factories (like faker + factory patterns)
│   ├── categories.rb
│   └── expenses.rb
├── models/                 ← Unit tests for models
│   ├── category_spec.rb
│   └── expense_spec.rb
├── requests/               ← Integration/API tests (like supertest in Jest)
│   └── api/
│       ├── categories_spec.rb
│       └── expenses_spec.rb
├── rails_helper.rb         ← Test configuration (like jest.config.js)
└── spec_helper.rb          ← RSpec core configuration
```

### `db/migrate/` — Database Migrations

**Rails equivalent of Prisma migrations or raw SQL migration files.**

Each migration is a Ruby file with a timestamp prefix that defines how to change the database schema:

```ruby
# db/migrate/20260218000002_create_expenses.rb
class CreateExpenses < ActiveRecord::Migration[7.2]
  def change
    create_table :expenses, if_not_exists: true do |t|
      t.string :description, null: false, limit: 255
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :date, null: false
      t.references :category, null: false, foreign_key: true, index: true
      t.timestamps
    end
  end
end
```

Compare to Prisma:
```prisma
model Expense {
  id          Int      @id @default(autoincrement())
  description String   @db.VarChar(255)
  amount      Decimal  @db.Decimal(10, 2)
  date        DateTime @db.Date
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### `db/schema.rb` — Current Schema Snapshot

This is auto-generated from running migrations. It is like `prisma migrate dev` generating your schema — except it is a **Ruby file**, not Prisma schema syntax. It is the single source of truth for the current database structure.

### `db/seeds.rb` — Seed Data

**Rails equivalent of a seed script or `prisma db seed`.**

This file populates the database with test data. Run with `rails db:seed`.

### `config/initializers/cors.rb` — Middleware Configuration

**Rails equivalent of Express `app.use(cors())`.**

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*"
    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end
```

This inserts the `rack-cors` middleware at the top of the middleware stack, allowing all origins. In Express, this would be a single line: `app.use(cors())`.

---

# SECTION 3 — Frontend Architecture

## Technology Stack

| Tool | Purpose | Express.js Equivalent |
|---|---|---|
| **Vite 5.1** | Dev server + bundler | `webpack-dev-server` or Vite in a JS project |
| **React 18** | UI library | Same |
| **TypeScript 5.3** | Type safety | Same |
| **No CSS framework** | Inline styles everywhere | — |

## Directory Structure

```
frontend/
├── index.html                ← Entry HTML (Vite injects scripts here)
├── package.json              ← Dependencies
├── vite.config.ts            ← Vite configuration
├── tsconfig.json             ← TypeScript configuration
└── src/
    ├── main.tsx              ← React entry point (renders <App />)
    ├── App.tsx               ← Root component + routing
    ├── types.ts              ← TypeScript interfaces
    ├── components/           ← Feature components
    │   ├── Sidebar.tsx
    │   ├── CalendarExpenseTable.tsx
    │   ├── CategoryBreakdown.tsx
    │   ├── ExpenseForm.tsx
    │   ├── MonthNavigation.tsx
    │   ├── YearNavigation.tsx
    │   └── QuickAddButton.tsx
    ├── constants/            ← Static data
    │   ├── categories.ts
    │   ├── categoryEmojis.ts
    │   └── colors.ts
    ├── hooks/                ← Custom React hooks
    │   └── useExpenseForm.ts
    ├── services/             ← API layer
    │   └── api.ts
    ├── utils/                ← Helper functions
    │   └── expenseUtils.ts
    ├── pages/                ← Page-level components
    │   └── HistoryPage.tsx
    └── vibes/                ← Custom component library
        ├── index.ts
        ├── Button.tsx
        ├── Modal.tsx
        ├── TextField.tsx
        ├── SelectBox.tsx
        ├── FormControl.tsx
        ├── Pagination.tsx
        ├── ColumnBase.tsx
        └── ItemTable.tsx
```

## Entry Point Chain

```
index.html
  └─ <script type="module" src="/src/main.tsx">
       └─ main.tsx
            └─ createRoot(rootElement).render(<App />)
                 └─ App.tsx
                      ├─ <Sidebar />
                      └─ <HistoryPage /> (when currentPage === "history")
```

`index.html` (`frontend/index.html:36`) loads `/src/main.tsx`. Vite intercepts this and bundles all TypeScript/React code. `main.tsx` (`frontend/src/main.tsx:12`) calls `createRoot().render(<App />)`. `App.tsx` (`frontend/src/App.tsx:7`) uses `useState("history")` to track which page to show — currently only `"history"` exists.

## Routing — No React Router

Despite `react-router-dom` being in `package.json`, it is **not used**. Instead, routing is handled by a `useState` in `App.tsx`:

```tsx
// frontend/src/App.tsx:7-8
const [currentPage, setCurrentPage] = useState("history");
```

And rendered conditionally:
```tsx
// frontend/src/App.tsx:35
{currentPage === "history" && <HistoryPage />}
```

The sidebar calls `onNavigate("history")` when clicked. This is like having a single-page app with manual "route" switching via state.

## The Vibes Component Library

The `src/vibes/` directory is a **custom, project-specific component library**. Think of it as this project's version of Material UI or Chakra UI, but hand-built. It exports reusable UI primitives:

| Component | Purpose | HTML Equivalent |
|---|---|---|
| `Button` | Styled button with variants (primary/secondary/danger/success) | `<button>` |
| `TextField` | Styled input with label and error state | `<input>` |
| `SelectBox` | Styled select dropdown | `<select>` |
| `Modal` | Overlay dialog with close behavior | Custom `<dialog>` |
| `Pagination` | Page navigation controls | Custom |
| `FormControl` | Label + error wrapper for form fields | Custom |
| `ColumnBase` | Table cell with alignment | `<td>`/`<th>` |
| `ItemTable` | Configurable data table | `<table>` |

All components use **inline styles** with the `COLORS` constant from `src/constants/colors.ts`. There is no CSS file in this project — every pixel is styled in JavaScript.

## API Layer

All HTTP calls are centralized in `frontend/src/services/api.ts`. This is like having an `api.js` file in a Node project that wraps `axios` or `fetch`:

```typescript
// frontend/src/services/api.ts:7
const API_BASE_URL = "http://localhost:3000/api";

export async function fetchExpenses(): Promise<Expense[]> { ... }
export async function getExpenses(year: number, month: number): Promise<Expense[]> { ... }
export async function fetchCategories(): Promise<Array<{ id: number; name: string }>> { ... }
export async function createExpense(data: ExpenseFormData): Promise<Expense> { ... }
export async function updateExpense(id: number, data: Partial<ExpenseFormData>): Promise<Expense> { ... }
export async function deleteExpense(id: number): Promise<void> { ... }
```

The `API_BASE_URL` is **hardcoded** — the `VITE_API_URL` env var in `docker-compose.yml` is not actually read by this file.

## Component Hierarchy

```
<App>
├── <Sidebar>
└── <HistoryPage>
    ├── <YearNavigation>
    ├── <MonthNavigation>
    ├── <CategoryBreakdown>
    ├── <CalendarExpenseTable>
    │   ├── <Pagination>
    │   ├── <Modal> (edit)
    │   │   └── <ExpenseForm>
    │   └── <Modal> (delete confirmation)
    └── <Modal> (add expense)
        └── <ExpenseForm>
```

---

# SECTION 4 — Request Lifecycle: Adding an Expense

This traces the COMPLETE flow from a button click to a MySQL INSERT and back.

## Step-by-Step Trace

### 1. User Clicks "Add Expense" Button

In `HistoryPage.tsx` (`frontend/src/pages/HistoryPage.tsx:151`):
```tsx
<Button variant="primary" onClick={() => setIsModalOpen(true)}>
  Add Expense
</Button>
```

This sets `isModalOpen` to `true`, which renders the Modal with the ExpenseForm.

### 2. Modal Opens, Form Renders

```tsx
// frontend/src/pages/HistoryPage.tsx:182-191
<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Expense">
  <ExpenseForm onSubmit={handleAddExpense} onCancel={() => setIsModalOpen(false)} />
</Modal>
```

`ExpenseForm` (`frontend/src/components/ExpenseForm.tsx:18-113`) uses the `useExpenseForm` hook to manage state:

```tsx
// frontend/src/hooks/useExpenseForm.ts:14-19
const [formData, setFormData] = useState<ExpenseFormData>({
  amount: initialData?.amount || "",
  description: initialData?.description || "",
  category: initialData?.category || "",
  date: initialData?.date || formatDate(new Date()),  // defaults to today
});
```

### 3. User Fills Form and Submits

The form has fields for amount, description, category (dropdown), and date. When the user clicks "Add Expense" (submit button), the `handleSubmit` function in the hook fires:

```tsx
// frontend/src/hooks/useExpenseForm.ts:56-78
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;  // client-side validation
  setIsSubmitting(true);
  try {
    await onSubmit(formData);  // calls HistoryPage's handleAddExpense
    setFormData({ amount: "", description: "", category: "", date: formatDate(new Date()) });
    setErrors({});
  } catch (error) { ... }
  finally { setIsSubmitting(false); }
};
```

### 4. HistoryPage Calls createExpense()

```tsx
// frontend/src/pages/HistoryPage.tsx:74-83
const handleAddExpense = async (data: ExpenseFormData) => {
  try {
    await createExpense(data);  // from api.ts
    setIsModalOpen(false);
    fetchExpenses();  // re-fetch all expenses to refresh the list
  } catch (error) { ... }
};
```

### 5. api.ts Makes the HTTP Request

```typescript
// frontend/src/services/api.ts:52-77
export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  // Step 5a: Convert category NAME to category ID
  const categories = await fetchCategories();
  const category = categories.find((c) => c.name === data.category);

  // Step 5b: Build the request body
  const expenseData = {
    description: data.description,
    amount: data.amount,
    category_id: category?.id,
    date: data.date,
  };

  // Step 5c: POST to Rails
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expense: expenseData }),
  });
  if (!response.ok) throw new Error("Failed to create expense");
  return response.json();
}
```

**Important detail:** The form sends the category as a **name** (string like `"Food"`), but the API needs a **category_id** (integer). So `createExpense` first fetches all categories, finds the matching one, and sends the ID. This is an **extra HTTP request** on every create.

The request body looks like:
```json
{
  "expense": {
    "description": "Team Lunch",
    "amount": "150.50",
    "category_id": 1,
    "date": "2026-07-27"
  }
}
```

### 6. Rails Receives the Request

**Step 6a: Routing**

The request `POST /api/expenses` hits `config/routes.rb`:
```ruby
namespace :api do
  resources :expenses, only: [ :index, :create, :update, :destroy ]
end
```

Rails matches `POST /api/expenses` to `Api::ExpensesController#create`.

**Step 6b: Strong Parameters**

Before the controller action runs, Rails wraps the JSON body into `params`. The `expense_params` private method filters what is allowed:

```ruby
# backend/app/controllers/api/expenses_controller.rb:46-48
def expense_params
  params.require(:expense).permit(:description, :amount, :category_id, :date)
end
```

This is Rails' **Strong Parameters** security feature. Even though the JSON contains `{ expense: { description, amount, category_id, date } }`, only the listed keys are permitted. Anything extra is silently dropped.

**Step 6c: The Create Action**

```ruby
# backend/app/controllers/api/expenses_controller.rb:18-26
def create
  expense = Expense.new(expense_params)
  if expense.save
    render json: format_expense(expense), status: :created
  else
    render json: { errors: expense.errors.full_messages },
           status: :unprocessable_entity
  end
end
```

### 7. ActiveRecord Creates the SQL

`Expense.new(expense_params)` creates an in-memory Ruby object. `expense.save` triggers ActiveRecord to:

1. Run validations (there are **none** defined on the Expense model, so it always passes)
2. Build an SQL INSERT statement
3. Execute it against MySQL

The generated SQL looks like:
```sql
INSERT INTO expenses (description, amount, category_id, date, created_at, updated_at)
VALUES ('Team Lunch', 150.50, 1, '2026-07-27', '2026-07-27 12:00:00', '2026-07-27 12:00:00');
```

ActiveRecord automatically populates `created_at` and `updated_at` from the `t.timestamps` in the migration.

### 8. Response is Sent Back

```ruby
render json: format_expense(expense), status: :created
```

The `format_expense` method builds a clean JSON object:
```ruby
# backend/app/controllers/api/expenses_controller.rb:50-60
def format_expense(expense)
  {
    id: expense.id,
    description: expense.description,
    amount: expense.amount.to_f,
    category: expense.category.name,   # NOTE: this is the name, not ID
    date: expense.date.to_s,
    created_at: expense.created_at,
    updated_at: expense.updated_at
  }
end
```

The response looks like:
```json
{
  "id": 1234,
  "description": "Team Lunch",
  "amount": 150.5,
  "category": "Food",
  "date": "2026-07-27",
  "created_at": "2026-07-27T12:00:00.000Z",
  "updated_at": "2026-07-27T12:00:00.000Z"
}
```

### 9. Frontend Receives Response and Refreshes

Back in `HistoryPage.tsx`:
```tsx
// frontend/src/pages/HistoryPage.tsx:74-83
const handleAddExpense = async (data: ExpenseFormData) => {
  await createExpense(data);       // await the POST
  setIsModalOpen(false);           // close the modal
  fetchExpenses();                 // re-fetch the full list from the API
};
```

`fetchExpenses()` calls `getExpenses(year, month)` which hits `GET /api/expenses?year=2026&month=7`, and the updated list is set into state, causing React to re-render the table.

---

# SECTION 5 — Reverse Lifecycle: Loading Expenses

What happens from page load to the expenses appearing on screen.

### 1. Browser Loads index.html

`frontend/index.html` is served by Vite on port 5173. The browser loads the HTML, which includes:
```html
<script type="module" src="/src/main.tsx"></script>
```

### 2. Vite Bundles and Serves main.tsx

Vite transpiles TypeScript and JSX on-the-fly. `main.tsx` executes:
```tsx
// frontend/src/main.tsx:12-16
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 3. App Renders

```tsx
// frontend/src/App.tsx:7
const [currentPage, setCurrentPage] = useState("history");
```

Since `currentPage` starts as `"history"`, `<HistoryPage />` is rendered.

### 4. HistoryPage Mounts and Reads URL

```tsx
// frontend/src/pages/HistoryPage.tsx:18-28
const getInitialYearMonth = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    year: yearParam ? parseInt(yearParam) : currentDate.getFullYear(),
    month: monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1,
  };
};
```

If you visit `http://localhost:5173/?year=2026&month=7`, it uses those values. Otherwise, it defaults to the current month.

### 5. useEffect Triggers fetchExpenses

```tsx
// frontend/src/pages/HistoryPage.tsx:48-50
useEffect(() => {
  fetchExpenses();
}, [selectedYear, selectedMonth]);
```

When the component mounts, the dependency array `[selectedYear, selectedMonth]` triggers the effect.

### 6. API Call to Rails

```tsx
// frontend/src/pages/HistoryPage.tsx:52-62
const fetchExpenses = async () => {
  setLoading(true);
  const data = await getExpenses(selectedYear, selectedMonth);
  setExpenses(data);
  setLoading(false);
};
```

This calls `api.ts`:
```typescript
// frontend/src/services/api.ts:23-34
export async function getExpenses(year: number, month: number): Promise<Expense[]> {
  const response = await fetch(
    `${API_BASE_URL}/expenses?year=${year}&month=${month}`
  );
  if (!response.ok) throw new Error("Failed to fetch expenses");
  return response.json();
}
```

### 7. Rails Handles GET /api/expenses

**Route:** `GET /api/expenses?year=2026&month=7`

```ruby
# backend/app/controllers/api/expenses_controller.rb:2-16
def index
  expenses = Expense.includes(:category).order(created_at: :desc)

  if params[:year].present? && params[:month].present?
    year = params[:year].to_i
    month = params[:month].to_i
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month
    expenses = expenses.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
  end

  render json: expenses.map { |expense| format_expense(expense) }
end
```

Key ActiveRecord operations:
- `Expense.includes(:category)` — eager loads categories to avoid N+1 queries
- `.order(created_at: :desc)` — newest first
- `.where(created_at: ...)` — filters by date range

Generated SQL:
```sql
SELECT expenses.*, categories.*
FROM expenses
INNER JOIN categories ON categories.id = expenses.category_id
WHERE expenses.created_at BETWEEN '2026-07-01 00:00:00' AND '2026-07-31 23:59:59'
ORDER BY expenses.created_at DESC;
```

### 8. Response Maps Through format_expense

Each expense is transformed to JSON with the **category name** (not the category object). This is done by calling `expense.category.name` — ActiveRecord lazily loads the associated Category record and reads its `name` column.

### 9. Frontend Updates State

```tsx
setExpenses(data);
```

React re-renders `HistoryPage`, which passes `expenses` to `<CalendarExpenseTable>` and computes category breakdowns inline.

### 10. Category Breakdown is Computed Client-Side

```tsx
// frontend/src/pages/HistoryPage.tsx:86-103
const categoryData = expenses.reduce((acc, expense) => {
  const category = expense.category || "Uncategorized";
  if (!acc[category]) {
    acc[category] = { category, amount: 0, count: 0 };
  }
  acc[category].amount += Number(expense.amount);
  acc[category].count += 1;
  return acc;
}, {} as Record<string, { category: string; amount: number; count: number }>);
```

This is a client-side `reduce()` — no additional API call. The breakdown is computed from the already-fetched expenses.

---

# SECTION 6 — Delete Expense Lifecycle

### 1. User Clicks "Delete" Button

In `CalendarExpenseTable.tsx` (`frontend/src/components/CalendarExpenseTable.tsx:41-44`):
```tsx
const handleDelete = (expense: Expense) => {
  setDeletingExpense(expense);     // store which expense to delete
  setIsDeleteModalOpen(true);      // open confirmation modal
};
```

### 2. Confirmation Modal Shows

```tsx
// frontend/src/components/CalendarExpenseTable.tsx:207-246
<Modal isOpen={isDeleteModalOpen} title="Delete Expense">
  <p>Are you sure you want to delete this expense?</p>
  <p><strong>{deletingExpense.description}</strong> - {formatCurrency(deletingExpense.amount)}</p>
  <Button variant="danger" onClick={confirmDelete}>Delete</Button>
</Modal>
```

### 3. User Confirms Delete

```tsx
// frontend/src/components/CalendarExpenseTable.tsx:46-57
const confirmDelete = async () => {
  if (!deletingExpense) return;
  await deleteExpense(deletingExpense.id);  // calls api.ts
  setIsDeleteModalOpen(false);
  setDeletingExpense(null);
  onExpenseUpdated();  // calls fetchExpenses() to refresh the list
};
```

### 4. API Sends DELETE Request

```typescript
// frontend/src/services/api.ts:104-112
export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete expense");
}
```

### 5. Rails Handles DELETE /api/expenses/:id

```ruby
# backend/app/controllers/api/expenses_controller.rb:38-42
def destroy
  expense = Expense.find(params[:id])
  expense.destroy
  head :no_content
end
```

- `Expense.find(params[:id])` — SQL: `SELECT * FROM expenses WHERE id = 1234;`
- `expense.destroy` — SQL: `DELETE FROM expenses WHERE id = 1234;`
- `head :no_content` — returns HTTP 204 with no body

**Note:** Because `dependent: :destroy` is NOT set on `Category.has_many :expenses`, deleting an expense does NOT cascade-delete categories. But if a Category were deleted, its expenses would be destroyed.

### 6. Frontend Refreshes

`onExpenseUpdated()` calls `fetchExpenses()` which re-fetches from the API, and the table re-renders without the deleted expense.

---

# SECTION 7 — Edit Expense Lifecycle

### 1. User Clicks "Edit" Button

```tsx
// frontend/src/components/CalendarExpenseTable.tsx:36-39
const handleEdit = (expense: Expense) => {
  setEditingExpense(expense);      // store the expense to edit
  setIsEditModalOpen(true);        // open edit modal
};
```

### 2. Edit Modal Shows Pre-filled Form

```tsx
// frontend/src/components/CalendarExpenseTable.tsx:181-205
<Modal isOpen={isEditModalOpen} title="Edit Expense">
  {editingExpense && (
    <ExpenseForm
      initialData={{
        amount: editingExpense.amount.toString(),
        description: editingExpense.description,
        category: editingExpense.category,      // category NAME
        date: formatDate(new Date(editingExpense.date)),
      }}
      onSubmit={handleUpdate}
      submitLabel="Update Expense"
    />
  )}
</Modal>
```

The `ExpenseForm` receives `initialData` which pre-fills the form fields via the `useExpenseForm` hook.

### 3. User Edits and Submits

The form goes through the same `useExpenseForm.handleSubmit` flow, but this time `onSubmit` is `handleUpdate`:

```tsx
// frontend/src/components/CalendarExpenseTable.tsx:59-70
const handleUpdate = async (data: ExpenseFormData) => {
  if (!editingExpense) return;
  await updateExpense(editingExpense.id, data);  // PUT request
  setIsEditModalOpen(false);
  setEditingExpense(null);
  onExpenseUpdated();  // refresh list
};
```

### 4. API Sends PUT Request

```typescript
// frontend/src/services/api.ts:82-99
export async function updateExpense(id: number, data: Partial<ExpenseFormData>): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expense: data }),
  });
  if (!response.ok) throw new Error("Failed to update expense");
  return response.json();
}
```

**Note:** Unlike `createExpense`, the `updateExpense` function does NOT convert category name to ID — it sends the category **name** as-is. This means the backend receives a `category` key that is NOT in the `expense_params` permit list. This is a **bug** (see Section 17).

### 5. Rails Handles PUT /api/expenses/:id

```ruby
# backend/app/controllers/api/expenses_controller.rb:28-36
def update
  expense = Expense.find(params[:id])
  if expense.update(expense_params)
    render json: format_expense(expense)
  else
    render json: { errors: expense.errors.full_messages },
           status: :unprocessable_entity
  end
end
```

`expense.update(expense_params)` generates an SQL UPDATE:
```sql
UPDATE expenses
SET description = 'Updated description', amount = 200.00, updated_at = '2026-07-27 12:00:00'
WHERE id = 1234;
```

### 6. Frontend Refreshes

Same as delete — `onExpenseUpdated()` re-fetches the list.

---

# SECTION 8 — Ruby Language Guide

This section teaches Ruby using ONLY code found in this repository.

## `def` / `end` — Function Definition

```ruby
# backend/app/controllers/api/expenses_controller.rb:46-48
def expense_params
  params.require(:expense).permit(:description, :amount, :category_id, :date)
end
```

**JavaScript equivalent:**
```javascript
function expenseParams() {
  return params.require('expense').permit('description', 'amount', 'category_id', 'date');
}
```

In Ruby, `def` starts a method and `end` closes it. There are no curly braces.

## `class` / `end` — Class Definition

```ruby
# backend/app/models/expense.rb:1-3
class Expense < ApplicationRecord
  belongs_to :category
end
```

**JavaScript equivalent:**
```javascript
class Expense extends ApplicationRecord {
  // ApplicationRecord provides all ActiveRecord methods
}
```

`< ApplicationRecord` means "inherits from". In JavaScript, this is `extends`. `ApplicationRecord` is a base class that provides database access (like a base model in Sequelize).

## `belongs_to` / `has_many` — Associations

```ruby
# backend/app/models/expense.rb
belongs_to :category

# backend/app/models/category.rb
has_many :expenses, dependent: :destroy
```

**JavaScript equivalent (conceptual Sequelize):**
```javascript
// Expense model
Expense.belongsTo(Category, { foreignKey: 'category_id' });

// Category model
Category.hasMany(Expense, { foreignKey: 'category_id', onDelete: 'CASCADE' });
```

`belongs_to` adds a `category_id` foreign key to the expenses table. `has_many` lets you call `category.expenses` to get all expenses for that category. `dependent: :destroy` means deleting a category also deletes all its expenses.

## `private` — Access Modifier

```ruby
# backend/app/controllers/api/expenses_controller.rb:44
private

def expense_params
  params.require(:expense).permit(:description, :amount, :category_id, :date)
end
```

**JavaScript equivalent:**
```javascript
// JavaScript doesn't have true private methods in classes (pre-# syntax)
// This is like a module-level function that's not exported
function expenseParams() { ... }
```

In Ruby, `private` makes all subsequent methods only callable from within the same object (not from outside). In a controller, this prevents the `expense_params` method from being accessible as a route action.

## `params` — Request Parameters

```ruby
params.require(:expense).permit(:description, :amount, :category_id, :date)
```

**JavaScript equivalent:**
```javascript
// Express
const { description, amount, category_id, date } = req.body.expense;
```

`params` is a Rails hash containing all request data (URL params, body, query string). `.require(:expense)` ensures the `expense` key exists (raises error if missing). `.permit(...)` whitelists specific keys — this is **Strong Parameters**, Rails' mass assignment protection.

## `render json:` — Sending JSON Response

```ruby
render json: expenses.map { |expense| format_expense(expense) }
```

**JavaScript equivalent:**
```javascript
res.json(expenses.map(expense => formatExpense(expense)));
```

`render` sends a response. `json:` is a Rails shorthand that serializes a Ruby hash/array to JSON and sets the Content-Type header.

## `head :no_content` — Empty Response

```ruby
head :no_content
```

**JavaScript equivalent:**
```javascript
res.status(204).send();
```

Sends HTTP 204 No Content with an empty body.

## `find` / `create!` / `destroy` — ActiveRecord Methods

```ruby
expense = Expense.find(params[:id])     # SELECT * FROM expenses WHERE id = ?
expense = Expense.new(expense_params)   # builds in-memory object (no DB)
expense.save                            # INSERT INTO expenses ...
expense.update(expense_params)          # UPDATE expenses SET ... WHERE id = ?
expense.destroy                         # DELETE FROM expenses WHERE id = ?
Category.create!(name: "Food")          # INSERT + raises on failure
```

**JavaScript equivalent (Sequelize):**
```javascript
const expense = await Expense.findByPk(id);
const expense = Expense.build({ description: '...' });
await expense.save();
await expense.update({ description: '...' });
await expense.destroy();
await Category.create({ name: 'Food' });
```

## `includes(:category)` — Eager Loading

```ruby
expenses = Expense.includes(:category).order(created_at: :desc)
```

**JavaScript equivalent:**
```javascript
const expenses = await Expense.findAll({
  include: [{ model: Category }],
  order: [['created_at', 'DESC']]
});
```

Without `includes`, accessing `expense.category` would trigger a **separate SQL query** for each expense (N+1 problem). With `includes`, Rails does a JOIN or two separate queries upfront to load all needed data.

## `where` with Ranges — Date Filtering

```ruby
expenses = expenses.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
```

**JavaScript equivalent:**
```javascript
expenses.where('created_at BETWEEN ? AND ?', startOfDay, endOfDay);
```

The `..` creates a Ruby Range. ActiveRecord converts this to a SQL `BETWEEN` clause.

## `.map { |expense| format_expense(expense) }` — Block Syntax

```ruby
expenses.map { |expense| format_expense(expense) }
```

**JavaScript equivalent:**
```javascript
expenses.map(expense => formatExpense(expense));
```

The `{ |expense| ... }` is a Ruby block — it is like an arrow function passed to `.map()`. The `|expense|` part is the parameter (like `expense =>`).

## Symbol Syntax `:symbol`

```ruby
params.require(:expense).permit(:description, :amount)
```

**JavaScript equivalent:**
```javascript
// Symbols are like unique string constants
// In JS, there's no direct equivalent, but imagine:
const DESCRIPTION = Symbol('description');
// Or more practically, just a string used as a key:
'expense'  // used as a hash key
```

In Ruby, `:expense` is a **Symbol** — an immutable, interned string. They are used as hash keys, method names, and identifiers. Think of them as lightweight constants that are always the same object.

## `||=` — Conditional Assignment

```ruby
expense = expenses.map { |expense| format_expense(expense) }
```

While not directly in this codebase, Ruby's `||=` is like JavaScript's `x = x || defaultValue`:
```ruby
x ||= 10    # equivalent to: x = x || 10
```

## `unless` — Negated If

Not used in this codebase, but for completeness:
```ruby
unless expense.save
  # runs if expense.save returns false
end
# equivalent to:
if !expense.save
  # same thing
end
```

## `namespace :api` — Route Namespacing

```ruby
namespace :api do
  resources :expenses
end
```

**JavaScript equivalent:**
```javascript
const apiRouter = express.Router();
apiRouter.use('/api', expensesRouter);
```

This creates a `/api/` prefix for all routes inside the block and wraps controllers in the `Api::` module.

## `resources :expenses, only: [...]` — RESTful Routes

```ruby
resources :expenses, only: [ :index, :create, :update, :destroy ]
```

This generates standard REST routes but **only** the specified ones. `only: [:index, :create, :update, :destroy]` means no `show`, `new`, or `edit` routes are created.

---

# SECTION 9 — Rails Magic

Things that happen automatically that you would need to set up manually in Express.

## 1. Controller Methods Become Endpoints

**Magic:** Define a method in a controller, and it automatically becomes an HTTP endpoint (if there is a matching route).

```ruby
class Api::ExpensesController < ApplicationController
  def index      # → GET /api/expenses
  def create     # → POST /api/expenses
  def update     # → PUT /api/expenses/:id
  def destroy    # → DELETE /api/expenses/:id
end
```

**In Express, you must explicitly define each route:**
```javascript
router.get('/expenses', controller.index);
router.post('/expenses', controller.create);
router.put('/expenses/:id', controller.update);
router.delete('/expenses/:id', controller.destroy);
```

**How it works:** Rails inspects the HTTP method + URL, looks at `routes.rb` to find which controller + action to call, then calls that method as a regular Ruby method on the controller instance.

## 2. `params` Automatically Parses JSON Bodies

**Magic:** When you send `POST /api/expenses` with `body: JSON.stringify({ expense: { description: "..." } })`, Rails automatically parses the JSON and makes it available as `params[:expense][:description]`.

**In Express, you need middleware:**
```javascript
app.use(express.json());  // you must add this
// Then: req.body.expense.description
```

**How it works:** Rails has built-in middleware that parses JSON request bodies. When the `Content-Type: application/json` header is present, the body is parsed into `params`.

## 3. `render json:` Sets Content-Type

**Magic:** `render json: { id: 1 }` automatically:
1. Serializes the Ruby hash to JSON
2. Sets `Content-Type: application/json`
3. Sends the response

**In Express:**
```javascript
res.json({ id: 1 });  // similar shorthand exists
```

## 4. ActiveRecord Maps Models to Tables

**Magic:** `Expense` automatically maps to the `expenses` table. `Category` maps to `categories`. The pluralization is automatic.

```ruby
Expense.all        # SELECT * FROM expenses
Expense.find(1)    # SELECT * FROM expenses WHERE id = 1
Expense.new(...)   # builds INSERT statement
```

**In Express with Sequelize, you define the model explicitly:**
```javascript
Expense.init({
  description: DataTypes.STRING,
  amount: DataTypes.DECIMAL,
  // ... you must define every column
}, { sequelize, tableName: 'expenses' });
```

**How it works:** ActiveRecord reads the database schema on boot. It knows `expenses` has columns `id`, `description`, `amount`, `category_id`, `date`, `created_at`, `updated_at` — and creates getter/setter methods for each one automatically.

## 5. `created_at` / `updated_at` Are Automatic

**Magic:** The `t.timestamps` line in the migration creates two columns, and ActiveRecord **automatically** fills them on create and update:

```ruby
expense = Expense.new(description: "Lunch", amount: 100, category_id: 1, date: Date.today)
expense.save
# created_at is automatically set to current time
# updated_at is automatically set to current time
```

**In Express, you would need:**
```javascript
// Either middleware or manual:
expense.created_at = new Date();
expense.updated_at = new Date();
// Or use Sequelize's `timestamps: true` option
```

## 6. `format_expense` Builds a Manual Serializer

**Magic (or rather, anti-magic):** This project does NOT use Rails serializers (like `active_model_serializers` or `jbuilder`). Instead, the controller manually builds JSON:

```ruby
def format_expense(expense)
  {
    id: expense.id,
    description: expense.description,
    amount: expense.amount.to_f,
    category: expense.category.name,  # traverses the association
    date: expense.date.to_s,
    created_at: expense.created_at,
    updated_at: expense.updated_at
  }
end
```

This is equivalent to Express where you would manually construct the response object:
```javascript
function formatExpense(expense) {
  return {
    id: expense.id,
    description: expense.description,
    amount: parseFloat(expense.amount),
    category: expense.category.name,
    date: expense.date.toISOString().split('T')[0],
    created_at: expense.created_at,
    updated_at: expense.updated_at
  };
}
```

## 7. `Expense.find` Raises on Missing Record

```ruby
expense = Expense.find(params[:id])
```

If no expense exists with that ID, Rails raises `ActiveRecord::RecordNotFound`, which automatically returns a **404 Not Found** response. You do not need to write `if (!expense) return 404`.

**In Express:**
```javascript
const expense = await Expense.findByPk(req.params.id);
if (!expense) return res.status(404).json({ error: 'Not found' });
```

## 8. Error Handling in create/update

```ruby
if expense.save
  render json: format_expense(expense), status: :created
else
  render json: { errors: expense.errors.full_messages },
         status: :unprocessable_entity
end
```

ActiveRecord collects validation errors into `expense.errors`. Even though this project has **no model validations**, the pattern is ready for them. If you added `validates :description, presence: true` to the model, `expense.save` would return `false` and `expense.errors.full_messages` would return `["Description can't be blank"]`.

## 9. `config.api_only = true`

```ruby
# backend/config/application.rb:30
config.api_only = true
```

This tells Rails to skip all view-related middleware (cookies, sessions, flash, CSRF protection, etc.). It makes the app lighter and faster since it only serves JSON.

## 10. Middleware Stack

Rails has a middleware stack (like Express middleware). The `rack-cors` gem is added as middleware:

```ruby
# backend/config/initializers/cors.rb:8
Rails.application.config.middleware.insert_before 0, Rack::Cors do
```

This is like Express:
```javascript
app.use(cors());
```

The `insert_before 0` means "add this at the very beginning of the middleware stack" — so CORS headers are added before anything else processes the request.

---

# SECTION 10 — Database

## Tables

### `categories` Table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Category name (e.g., "Food") |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last modification time |

**Indexes:**
- `idx_name` on `name` (for fast lookups)
- `index_categories_on_name` UNIQUE on `name` (prevents duplicates)
- `name` UNIQUE (third duplicate index — see Section 17)

### `expenses` Table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `description` | VARCHAR(255) | NOT NULL | What was spent on |
| `amount` | DECIMAL(10,2) | NOT NULL | Amount in dollars |
| `date` | DATE | NOT NULL | Date of expense |
| `category_id` | INT | NOT NULL, FOREIGN KEY → categories.id | Which category |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last modification time |

**Note:** The `expenses` table in the migration does NOT have a `payer_name` column, but `db/schema.rb` shows `payer_name` exists. The `db/init.sql` (used by Docker) includes `payer_name`. This means the column exists in the Docker-created database but is NOT managed by Rails migrations.

## Relationships

```
categories (1) ──────< (many) expenses
    │                         │
    │  id                     │  category_id (FK)
    │  name                   │  description
    │                         │  amount
    │                         │  date
```

- `Category has_many :expenses` — one category can have many expenses
- `Expense belongs_to :category` — each expense has exactly one category

## Migrations

Migration files live in `backend/db/migrate/`:

```
20260218000001_create_categories.rb
20260218000002_create_expenses.rb
```

The timestamp prefix determines the order they run. `20260218000001` runs before `20260218000002`.

**Running migrations:**
```bash
rails db:migrate          # runs all pending migrations
rails db:rollback         # undoes the last migration
rails db:migrate:status   # shows which migrations have run
```

**Schema vs Migration discrepancy (important):**
The migration (`20260218000002_create_expenses.rb`) creates a `date` column. But `db/schema.rb` does NOT include `date` — instead it includes `payer_name`. This means the schema.rb file is **out of sync** with the migrations. The actual database state depends on whether it was created via Docker (using `db/init.sql`) or via Rails migrations.

## Indexes

| Table | Index Name | Column(s) | Purpose |
|---|---|---|---|
| categories | `idx_name` | `name` | Fast category lookup by name |
| categories | `index_categories_on_name` | `name` (UNIQUE) | Prevent duplicate names |
| categories | `name` | `name` (UNIQUE) | Third duplicate index |
| expenses | `idx_category_id` | `category_id` | Fast JOIN on category |
| expenses | `idx_created_at` | `created_at` | Fast date range queries |
| expenses | `expenses_ibfk_1` | `category_id` (FK) | Foreign key constraint |

---

# SECTION 11 — API Documentation

All endpoints are namespaced under `/api/`. Base URL: `http://localhost:3000`

## GET /api/expenses

**Purpose:** List expenses, optionally filtered by year/month.

| Detail | Value |
|---|---|
| Controller | `Api::ExpensesController#index` |
| Method | `GET` |
| URL | `/api/expenses` or `/api/expenses?year=2026&month=7` |
| Parameters | `year` (optional), `month` (optional) |
| Response | `200 OK` — JSON array of expense objects |
| Frontend caller | `api.ts:getExpenses()` → `HistoryPage.tsx:fetchExpenses()` |

**Response shape:**
```json
[
  {
    "id": 1234,
    "description": "Team Lunch",
    "amount": 150.5,
    "category": "Food",
    "date": "2026-07-27",
    "created_at": "2026-07-27T12:00:00.000Z",
    "updated_at": "2026-07-27T12:00:00.000Z"
  }
]
```

**Database:** SELECT from `expenses` JOIN `categories`, optionally WHERE `created_at BETWEEN ...`

---

## POST /api/expenses

**Purpose:** Create a new expense.

| Detail | Value |
|---|---|
| Controller | `Api::ExpensesController#create` |
| Method | `POST` |
| URL | `/api/expenses` |
| Body | `{ "expense": { "description": "...", "amount": 100, "category_id": 1, "date": "2026-07-27" } }` |
| Response | `201 Created` — JSON of created expense |
| Errors | `422 Unprocessable Entity` — `{ "errors": [...] }` |
| Frontend caller | `api.ts:createExpense()` → `HistoryPage.tsx:handleAddExpense()` |

**Request body:**
```json
{
  "expense": {
    "description": "Team Lunch",
    "amount": 150.50,
    "category_id": 1,
    "date": "2026-07-27"
  }
}
```

**Database:** INSERT INTO `expenses`

---

## PUT /api/expenses/:id

**Purpose:** Update an existing expense.

| Detail | Value |
|---|---|
| Controller | `Api::ExpensesController#update` |
| Method | `PUT` |
| URL | `/api/expenses/:id` |
| Body | `{ "expense": { "description": "...", "amount": 200 } }` |
| Response | `200 OK` — JSON of updated expense |
| Errors | `404 Not Found` (if ID invalid), `422 Unprocessable Entity` |
| Frontend caller | `api.ts:updateExpense()` → `CalendarExpenseTable.tsx:handleUpdate()` |

**Database:** UPDATE `expenses` SET ... WHERE id = :id

---

## DELETE /api/expenses/:id

**Purpose:** Delete an expense.

| Detail | Value |
|---|---|
| Controller | `Api::ExpensesController#destroy` |
| Method | `DELETE` |
| URL | `/api/expenses/:id` |
| Response | `204 No Content` (empty body) |
| Errors | `404 Not Found` (if ID invalid) |
| Frontend caller | `api.ts:deleteExpense()` → `CalendarExpenseTable.tsx:confirmDelete()` |

**Database:** DELETE FROM `expenses` WHERE id = :id

---

## GET /api/categories

**Purpose:** List all categories in alphabetical order.

| Detail | Value |
|---|---|
| Controller | `Api::CategoriesController#index` |
| Method | `GET` |
| URL | `/api/categories` |
| Response | `200 OK` — JSON array of category objects |
| Frontend caller | `api.ts:fetchCategories()` → called by `createExpense()` |

**Response shape:**
```json
[
  { "id": 1, "name": "Education", "created_at": "...", "updated_at": "..." },
  { "id": 2, "name": "Entertainment", "created_at": "...", "updated_at": "..." }
]
```

**Database:** SELECT FROM `categories` ORDER BY name ASC

---

# SECTION 12 — Data Flow Diagrams

## Create Expense

```
  User clicks "Add Expense"
          │
          ▼
  HistoryPage opens Modal
  ExpenseForm renders with empty fields
          │
          ▼
  User fills form, clicks Submit
          │
          ▼
  useExpenseForm.handleSubmit()
  ├── Validates: amount > 0, description non-empty, category selected, date set
  ├── Calls onSubmit(formData)
  └── HistoryPage.handleAddExpense(data)
          │
          ▼
  api.ts createExpense(data)
  ├── GET /api/categories  (to convert category name → ID)
  ├── Finds category by name
  └── POST /api/expenses  { expense: { description, amount, category_id, date } }
          │
          ▼
  Rails Router: POST /api/expenses
  └── Routes to Api::ExpensesController#create
          │
          ▼
  Controller: expense_params (Strong Params filters)
  └── Expense.new(expense_params)
  └── expense.save
          │
          ▼
  ActiveRecord: SQL INSERT INTO expenses
          │
          ▼
  MySQL writes to `expenses` table
          │
          ▼
  Controller: format_expense(expense) → JSON response 201
          │
          ▼
  api.ts receives JSON
  └── HistoryPage: setIsModalOpen(false), fetchExpenses()
          │
          ▼
  GET /api/expenses?year=...&month=...
  └── Rails: SELECT expenses.* FROM expenses WHERE created_at BETWEEN ...
          │
          ▼
  React state updated: setExpenses(data)
  └── UI re-renders with new expense in table
```

## Read / Load Expenses

```
  Page loads (or year/month changes)
          │
          ▼
  HistoryPage useEffect([selectedYear, selectedMonth])
          │
          ▼
  fetchExpenses()
  └── api.ts getExpenses(year, month)
          │
          ▼
  GET /api/expenses?year=2026&month=7
          │
          ▼
  Rails: Expense.includes(:category).order(created_at: :desc)
         .where(created_at: range)
          │
          ▼
  SQL: SELECT expenses.*, categories.*
       FROM expenses
       INNER JOIN categories ON ...
       WHERE expenses.created_at BETWEEN ...
       ORDER BY expenses.created_at DESC
          │
          ▼
  Controller maps through format_expense()
  └── Each expense gets category NAME (not object)
          │
          ▼
  JSON response → api.ts → HistoryPage state
          │
          ▼
  ┌───────────────────────────────┐
  │  CategoryBreakdown            │
  │  (computed from expenses via  │
  │   client-side reduce())       │
  └───────────────────────────────┘
  ┌───────────────────────────────┐
  │  CalendarExpenseTable         │
  │  (paginated, 10 per page)    │
  │  with Edit/Delete buttons     │
  └───────────────────────────────┘
```

## Update Expense

```
  User clicks "Edit" on expense row
          │
          ▼
  CalendarExpenseTable: setEditingExpense(expense), setIsEditModalOpen(true)
          │
          ▼
  Modal opens with ExpenseForm
  initialData = { amount, description, category, date } from expense
          │
          ▼
  User edits fields, clicks "Update Expense"
          │
          ▼
  useExpenseForm.handleSubmit()
  └── CalendarExpenseTable.handleUpdate(data)
          │
          ▼
  api.ts updateExpense(id, data)
  └── PUT /api/expenses/:id  { expense: { ... } }
          │
          ▼
  Rails: Expense.find(id) → expense.update(expense_params)
  └── SQL: UPDATE expenses SET description=..., amount=... WHERE id=...
          │
          ▼
  Response: JSON of updated expense → 200 OK
          │
          ▼
  CalendarExpenseTable: onExpenseUpdated() → fetchExpenses()
  └── Full list re-fetched, UI re-renders
```

## Delete Expense

```
  User clicks "Delete" on expense row
          │
          ▼
  CalendarExpenseTable: setDeletingExpense(expense), setIsDeleteModalOpen(true)
          │
          ▼
  Confirmation Modal: "Are you sure?"
          │
          ▼
  User clicks "Delete" (confirm)
          │
          ▼
  api.ts deleteExpense(id)
  └── DELETE /api/expenses/:id
          │
          ▼
  Rails: Expense.find(id) → expense.destroy
  └── SQL: DELETE FROM expenses WHERE id=...
          │
          ▼
  Response: 204 No Content
          │
          ▼
  CalendarExpenseTable: onExpenseUpdated() → fetchExpenses()
  └── Full list re-fetched, UI re-renders
```

---

# SECTION 13 — Docker

## docker-compose.yml Overview

```yaml
# docker-compose.yml — defines 3 services
services:
  db:        # MySQL 8.0
  backend:   # Rails API (Ruby 3.3.7)
  frontend:  # Vite + React (Node 18)
```

## Service Details

### `db` — MySQL 8.0

| Setting | Value | Purpose |
|---|---|---|
| Image | `mysql:8.0` | Official MySQL Docker image |
| Port | `3306:3306` | Accessible from host machine |
| Root password | `rootpassword` | Superuser access |
| Database | `expense_system_development` | Created on startup |
| User/Password | `expense_user` / `expense_password` | App-level credentials |
| Volume | `mysql_data:/var/lib/mysql` | Persists data across restarts |
| Init script | `./db/init.sql` | Creates tables + seed data on first run |
| Healthcheck | `mysqladmin ping` | Waits for MySQL to be ready |

### `backend` — Rails API

| Setting | Value | Purpose |
|---|---|---|
| Build | `./backend/Dockerfile` | Ruby 3.3.7 slim image |
| Port | `3000:3000` | API accessible from host |
| Depends on | `db` (condition: service_healthy) | Waits for MySQL healthcheck |
| Volume | `./backend:/rails` | Live code reloading in dev |
| Command | `bundle install && rails db:migrate && rails db:seed && rails server` | Full startup sequence |

### `frontend` — Vite + React

| Setting | Value | Purpose |
|---|---|---|
| Build | `./frontend/Dockerfile` | Node 18 image |
| Port | `5173:5173` | Dev server accessible from host |
| Depends on | `backend` | Starts after backend is running |
| Volume | `./frontend:/app` | Live code reloading |
| Command | `npm run dev -- --host` | Vite dev server on 0.0.0.0 |

## Networking

All three services are on the `expense_network` bridge network. This means:
- `backend` can reach `db` at hostname `db` (port 3306)
- `frontend` can reach `backend` at hostname `backend` (port 3000)
- The **host machine** accesses frontend at `localhost:5173` and backend at `localhost:3000`

## Volumes

| Volume | Purpose |
|---|---|
| `mysql_data` | Persists MySQL data across container restarts |
| `backend_gems` | Caches Ruby gems so `bundle install` is faster |
| `frontend_node_modules` | Caches npm dependencies |

## Startup Sequence

```
docker compose up
    │
    ▼
1. db starts (MySQL 8.0)
   └── runs /docker-entrypoint-initdb.d/init.sql
       ├── CREATE DATABASE expense_system_development
       ├── CREATE TABLE categories
       ├── CREATE TABLE expenses
       ├── INSERT categories (Food, Transport, Supplies, Entertainment, Utilities)
       └── INSERT 15 sample expenses
   └── healthcheck: mysqladmin ping
       └── waits until MySQL responds to ping
    │
    ▼
2. backend starts (only after db is healthy)
   ├── bundle install (installs gems)
   ├── rails db:migrate (runs pending migrations)
   ├── rails db:seed (generates ~2500+ expenses)
   └── rails server -b 0.0.0.0 (starts on port 3000)
    │
    ▼
3. frontend starts (after backend starts)
   └── npm run dev -- --host (Vite on port 5173)
```

**Important note about Docker init.sql vs Rails migrations:** The `db/init.sql` file creates the `expenses` table with a `payer_name` column but NO `date` column. The Rails migration (`20260218000002_create_expenses.rb`) creates a `date` column but NO `payer_name` column. When Docker starts, the init.sql runs FIRST, then `rails db:migrate` runs. Since the migration uses `if_not_exists: true`, if the table already exists (from init.sql), the migration might not add the `date` column. This is a potential issue.

---

# SECTION 14 — Development Workflow

## What Happens After `docker compose up`

### Phase 1: MySQL Initialization

```
Container: db
├── MySQL 8.0 starts
├── Reads /docker-entrypoint-initdb.d/init.sql
│   ├── Creates database
│   ├── Creates tables (categories, expenses)
│   ├── Inserts 5 categories
│   └── Inserts 15 sample expenses
└── Healthcheck passes → db is "healthy"
```

The `init.sql` file runs **only once** when the MySQL data volume is first created. If the volume already exists (from a previous `docker compose up`), the init script does NOT re-run.

### Phase 2: Rails Boot

```
Container: backend
├── bundle install
│   └── Installs all gems from Gemfile (comparable to npm install)
├── rails db:migrate
│   └── Checks schema_migrations table for pending migrations
│   └── Runs any that haven't been applied
├── rails db:seed
│   └── Runs db/seeds.rb
│   └── DESTROYS all existing data (Category.destroy_all, Expense.destroy_all)
│   └── Creates 10 categories + ~2500 expenses (Jan 2024 – Feb 2026)
└── rails server -b 0.0.0.0
    └── Starts Puma web server on port 3000
```

**Warning:** `rails db:seed` runs every time the container starts (because the command in docker-compose.yml includes it). It **destroys all existing data** first. This means any changes you make via the API will be lost on container restart.

### Phase 3: Vite Boot

```
Container: frontend
├── npm install (installs node_modules)
└── npm run dev -- --host
    └── Vite dev server starts on 0.0.0.0:5173
    └── Serves index.html at http://localhost:5173
    └── Watches for file changes (HMR)
```

### Phase 4: Communication

```
Browser → http://localhost:5173
  └── Vite serves React app
  └── React calls http://localhost:3000/api/expenses
  └── Request goes to backend container (via Docker network)
  └── Rails processes request, queries MySQL
  └── JSON response → React state → UI renders
```

## Environment Variables

| Variable | Where Set | Default | Purpose |
|---|---|---|---|
| `RAILS_ENV` | docker-compose.yml | `development` | Rails environment |
| `DATABASE_HOST` | docker-compose.yml | `db` (Docker) / `localhost` (local) | MySQL hostname |
| `DATABASE_PORT` | docker-compose.yml | `3306` | MySQL port |
| `DATABASE_NAME` | docker-compose.yml | `expense_system_development` | Database name |
| `DATABASE_USERNAME` | docker-compose.yml | `expense_user` | MySQL username |
| `DATABASE_PASSWORD` | docker-compose.yml | `expense_password` | MySQL password |
| `VITE_API_URL` | docker-compose.yml | `http://localhost:3000` | API URL (**NOT used** by api.ts) |

---

# SECTION 15 — Rails vs Express

## Side-by-Side Comparison

| Concept | Express.js | Rails |
|---|---|---|
| **Language** | JavaScript | Ruby |
| **Runtime** | Node.js | Ruby (MRI) |
| **Framework type** | Minimal, unopinionated | Full-stack, convention-over-configuration |
| **Entry point** | `app.js` / `server.js` | `config/application.rb` + `config/routes.rb` |
| **Routing** | `router.get('/path', handler)` | `resources :things` in routes.rb + controller methods |
| **Controllers** | Route handlers (often inline) | Separate `*_controller.rb` files with named actions |
| **Models** | Prisma/Sequelize/Mongoose schema | ActiveRecord class (infers from DB schema) |
| **ORM** | Prisma, Sequelize, TypeORM | ActiveRecord |
| **Database config** | `.env` or `prisma/schema.prisql` | `config/database.yml` (YAML with ERB) |
| **Dependencies** | `package.json` + `npm install` | `Gemfile` + `bundle install` |
| **Dependency lock** | `package-lock.json` | `Gemfile.lock` |
| **Test framework** | Jest, Mocha, Vitest | RSpec (or Minitest) |
| **Test command** | `npm test` / `npx jest` | `bundle exec rspec` |
| **Linting** | ESLint | RuboCop |
| **Environment** | `process.env.NODE_ENV` | `Rails.env` / `RAILS_ENV` |
| **Middleware** | `app.use(middleware)` | `config.middleware.use` in initializers |
| **JSON response** | `res.json(data)` | `render json: data` |
| **Body parsing** | `app.use(express.json())` | Built-in (automatic) |
| **Params access** | `req.body`, `req.query`, `req.params` | `params` (unified hash) |
| **Static files** | `express.static('public')` | `public/` directory (not used in API-only) |
| **CORS** | `app.use(cors())` | `rack-cors` gem + initializer |
| **Migrations** | Prisma migrate / Knex / raw SQL | `rails db:migrate` with Ruby migration files |
| **Seeding** | Custom script / `prisma db seed` | `rails db:seed` |
| **Server start** | `node server.js` / `npm run dev` | `rails server` |
| **Port** | Usually 3000 or 8080 | 3000 |
| **Convention** | Explicit everything | Convention over configuration |

## Key Conceptual Differences

### Routing

**Express:** You define every route explicitly.
```javascript
router.get('/api/expenses', controller.list);
router.post('/api/expenses', controller.create);
router.put('/api/expenses/:id', controller.update);
router.delete('/api/expenses/:id', controller.delete);
```

**Rails:** You declare resources, and routes are generated automatically.
```ruby
resources :expenses, only: [:index, :create, :update, :destroy]
# This single line generates 4 routes
```

### Controllers

**Express:** Route handler is a function that receives `(req, res)`.
```javascript
exports.create = async (req, res) => {
  const expense = await Expense.create(req.body);
  res.status(201).json(expense);
};
```

**Rails:** Controller is a class with methods. `params` is a global-like hash. `render` sends the response.
```ruby
def create
  expense = Expense.new(expense_params)
  if expense.save
    render json: expense, status: :created
  else
    render json: { errors: expense.errors }, status: :unprocessable_entity
  end
end
```

### Models

**Express (Prisma):** You define the schema in a DSL file.
```prisma
model Expense {
  id          Int      @id @default(autoincrement())
  description String
  amount      Decimal
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  Int
}
```

**Rails (ActiveRecord):** The model is minimal. The database IS the schema.
```ruby
class Expense < ApplicationRecord
  belongs_to :category
end
```

ActiveRecord reads `expenses.description VARCHAR(255) NOT NULL` from the database and creates `expense.description` getter/setter automatically. You do not define columns in the model.

### Validation

**Express (Prisma):** You define validation in schema or use middleware.
```prisma
model Expense {
  description String @db.VarChar(255)
  // Prisma doesn't have built-in validation beyond types
}
// You'd use a library like Zod or Joi
```

**Rails:** Validation is in the model.
```ruby
class Expense < ApplicationRecord
  belongs_to :category
  validates :description, presence: true
  validates :amount, numericality: { greater_than: 0 }
end
```

(This project has NO validations, but this is how you would add them.)

### Middleware

**Express:**
```javascript
app.use(cors());
app.use(express.json());
app.use(logger('dev'));
```

**Rails:**
```ruby
# config/application.rb
config.api_only = true

# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*"
    resource "*"
  end
end
```

### Error Handling

**Express:** You write error-handling middleware or use try/catch.
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

**Rails:** `ActiveRecord::RecordNotFound` is automatically rescued and returns 404. Validation failures are handled in the controller with `if expense.save` / `else`.

---

# SECTION 16 — Hidden Things

Things that junior developers often miss.

## 1. Strong Parameters (Mass Assignment Protection)

```ruby
# backend/app/controllers/api/expenses_controller.rb:46-48
def expense_params
  params.require(:expense).permit(:description, :amount, :category_id, :date)
end
```

**Why it exists:** Without this, a malicious user could send `{ "expense": { "admin": true } }` and modify any column. Strong Parameters whitelist which fields are allowed.

**Express equivalent:** You would manually destructure `req.body` or use a validation library like Joi/Zod.

**What happens if you forget:** Rails will raise an `ActionController::UnfilteredParameters` error and return a 500.

## 2. `dependent: :destroy` Cascade

```ruby
# backend/app/models/category.rb
has_many :expenses, dependent: :destroy
```

**What it does:** If you delete a Category, all its Expenses are automatically deleted too.

**Without it:** Deleting a Category that has expenses would violate the foreign key constraint and MySQL would raise an error.

**In Express/Sequelize:** You would set `onDelete: 'CASCADE'` in the model association or foreign key definition.

## 3. N+1 Query Prevention

```ruby
# backend/app/controllers/api/expenses_controller.rb:3
expenses = Expense.includes(:category).order(created_at: :desc)
```

**Without `includes`:** When you access `expense.category.name` for each expense, ActiveRecord would fire a separate `SELECT * FROM categories WHERE id = ?` query. For 100 expenses, that is 101 queries (1 for expenses + 100 for categories = N+1).

**With `includes`:** Rails does ONE additional query to load all needed categories:
```sql
SELECT * FROM categories WHERE id IN (1, 2, 3, 4, 5);
```

Total: 2 queries regardless of how many expenses.

## 4. `format_expense` is NOT a Serializer

```ruby
# backend/app/controllers/api/expenses_controller.rb:50-60
def format_expense(expense)
  {
    id: expense.id,
    description: expense.description,
    amount: expense.amount.to_f,
    category: expense.category.name,
    ...
  }
end
```

This is a **manual** JSON builder. Rails has proper serializers (`active_model_serializers`, `jsonapi-serializer`, `jbuilder`) that handle this more cleanly. This project does not use them.

**Potential issue:** `expense.category.name` triggers a database query if the category was not already eager-loaded. In the `index` action, `includes(:category)` prevents this. But if `format_expense` is called elsewhere without eager loading, it could cause N+1 queries.

## 5. `render` Returns, Not Throws

In Rails controllers, `render` does NOT end execution of the action method. Unlike Express's `res.json()` which often ends the handler, in Rails, code AFTER `render` still runs (but the response is already sent).

```ruby
def create
  expense = Expense.new(expense_params)
  if expense.save
    render json: format_expense(expense), status: :created
    # Code here WOULD still execute if there were any
  else
    render json: { errors: expense.errors.full_messages },
           status: :unprocessable_entity
  end
end
```

In this project, there is no code after `render`, so it does not matter. But in more complex controllers, you might use `return` after render to prevent further execution.

## 6. `if_not_exists: true` in Migration

```ruby
# backend/db/migrate/20260218000002_create_expenses.rb
create_table :expenses, if_not_exists: true do |t|
```

This means the migration will NOT raise an error if the table already exists. This is useful when the `init.sql` creates the table before migrations run. However, it also means the migration will NOT add columns that don't exist in the pre-created table (like the `date` column).

## 7. `use_transactional_fixtures = true`

```ruby
# backend/spec/rails_helper.rb:41
config.use_transactional_fixtures = true
```

This wraps each test in a database transaction that is rolled back after the test completes. So test data never pollutes other tests. This is like Jest's `beforeEach` / `afterEach` with database cleanup, but automatic.

## 8. Factory Defaults Conflict with DB Constraints

```ruby
# backend/spec/factories/expenses.rb
factory :expense do
  description { "MyString" }
  amount { "9.99" }
  category { nil }      # ← category is nil by default
  payer_name { "MyString" }
end
```

**Problem:** `category: nil` violates the database NOT NULL constraint on `category_id`. If you use `create(:expense)` without specifying a category, it will fail. The test specs avoid this by manually creating categories with `Category.create!` and passing them explicitly.

## 9. The `payer_name` Column Exists But Is Unused

The database has a `payer_name` column (created by `db/init.sql` in Docker), but:
- The migration does NOT create it
- The model does NOT reference it
- The controller does NOT permit it in `expense_params`
- The `format_expense` method does NOT include it in the response

It is a phantom column that exists in the DB but is invisible to the Rails application.

## 10. `db:seed` Destroys Everything

```ruby
# backend/db/seeds.rb:3-4
Expense.destroy_all
Category.destroy_all
```

Every time `rails db:seed` runs, ALL existing data is deleted first. In the Docker setup, this runs on every container start. Any data created through the API is lost on restart.

## 11. Category Breakdown is Client-Side Only

```tsx
// frontend/src/pages/HistoryPage.tsx:86-103
const categoryData = expenses.reduce((acc, expense) => { ... });
```

The category breakdown is computed entirely in the browser from the fetched expenses array. There is no separate API endpoint for aggregated data. For a small dataset this is fine, but with thousands of expenses, this could be slow.

## 12. Frontend Category Name → Backend Category ID

```typescript
// frontend/src/services/api.ts:53-55
const categories = await fetchCategories();
const category = categories.find((c) => c.name === data.category);
```

The form sends category by **name** (e.g., "Food"), but the API needs `category_id` (e.g., 1). The `createExpense` function fetches ALL categories to do this lookup. This is an extra HTTP request on every expense creation.

---

# SECTION 17 — Technical Debt

## Code Smells

### 1. Duplicate Indexes on categories.name

```sql
-- From db/schema.rb
t.index ["name"], name: "idx_name"
t.index ["name"], name: "index_categories_on_name", unique: true
t.index ["name"], name: "name", unique: true
```

Three indexes on the same column. Two are UNIQUE, one is not. This wastes storage and slows down writes. Only one UNIQUE index is needed.

### 2. Schema.rb is Out of Sync with Migrations

The migration creates `date` column but `schema.rb` shows `payer_name` instead. `schema.rb` should be regenerated with `rails db:schema:dump` to reflect the actual migration state.

### 3. `createExpense` Makes Two HTTP Requests

```typescript
// frontend/src/services/api.ts:52-77
export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  const categories = await fetchCategories();  // ← extra HTTP request
  const category = categories.find((c) => c.name === data.category);
  // ... then POST the expense
}
```

This fetches all categories on every expense creation. The categories rarely change — they could be cached in state or fetched once at app load.

### 4. `updateExpense` Sends Category Name, Not ID

```typescript
// frontend/src/services/api.ts:82-99
export async function updateExpense(id: number, data: Partial<ExpenseFormData>): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify({ expense: data }),  // sends category NAME
  });
}
```

The `data` object has `category` as a name string (e.g., `"Food"`), but the controller only permits `category_id`. The `category` key is silently dropped by Strong Parameters. This means **updating an expense cannot change its category**.

### 5. No Model Validations

```ruby
# backend/app/models/expense.rb
class Expense < ApplicationRecord
  belongs_to :category
end
```

There are no validations at all. The existing tests even show that negative amounts and empty descriptions are accepted:

```ruby
# backend/spec/requests/api/expenses_spec.rb:54-69
it "with negative amounts" do
  # ... amount: -100.00
  expect(response).to have_http_status(:created)  # ← this PASSES
end

it "with empty descriptions" do
  # ... description: ""
  expect(response).to have_http_status(:created)  # ← this PASSES
end
```

### 6. Frontend Categories are Hardcoded

```typescript
// frontend/src/constants/categories.ts
export const EXPENSE_CATEGORIES = [
  "Food", "Transportation", "Entertainment", "Shopping", "Bills",
  "Healthcare", "Education", "Travel", "Personal", "Other",
] as const;
```

These must match the database seed data exactly. If someone adds a category in the DB, the frontend dropdown won't show it. The categories should be fetched from the API (which the `createExpense` function already does, but the form dropdown does not).

### 7. `VITE_API_URL` is Unused

```yaml
# docker-compose.yml:71
VITE_API_URL: http://localhost:3000
```

```typescript
// frontend/src/services/api.ts:7
const API_BASE_URL = "http://localhost:3000/api";  // hardcoded
```

The env var is set but never read. The API URL is hardcoded.

### 8. `QuickAddButton` Component is Unused

`frontend/src/components/QuickAddButton.tsx` exists but is never imported or rendered anywhere. It is dead code.

### 9. `react-router-dom` is Installed but Unused

```json
// frontend/package.json
"react-router-dom": "^6.22.0"
```

The dependency is listed but routing is done with `useState` in `App.tsx`. This adds unnecessary bundle size.

### 10. `ItemTable` and `ColumnBase` Vibes Components are Unused

`frontend/src/vibes/ItemTable.tsx` and `frontend/src/vibes/ColumnBase.tsx` exist in the component library but are never imported anywhere in the application. They appear to be scaffolding for future use.

## Security Issues

### 1. CORS Allows All Origins

```ruby
# backend/config/initializers/cors.rb
origins "*"
```

This allows ANY website to make requests to the API. In production, this should be restricted to the frontend domain.

### 2. Database Credentials in docker-compose.yml

```yaml
MYSQL_ROOT_PASSWORD: rootpassword
MYSQL_PASSWORD: expense_password
```

Hardcoded credentials in a committed file. In production, these should be in environment variables or a secrets manager.

### 3. No Authentication

There is no authentication or authorization. Anyone can create, read, update, or delete any expense. There is no user model.

## Performance Issues

### 1. Category Breakdown Computed on Every Render

```tsx
// frontend/src/pages/HistoryPage.tsx:86-103
const categoryData = expenses.reduce((acc, expense) => { ... });
```

This `reduce()` runs on every render of `HistoryPage`. It should be memoized with `useMemo`.

### 2. No Pagination on API

The `GET /api/expenses` endpoint returns ALL expenses for the selected month. For months with many expenses, this could be slow. Client-side pagination (`CalendarExpenseTable` shows 10 per page) helps the UI, but the API still transfers everything.

### 3. `format_expense` Calls `.to_f` and `.to_s`

```ruby
amount: expense.amount.to_f,
date: expense.date.to_s,
```

`.to_f` converts a `Decimal` to a floating-point number, which can lose precision for financial data. Dollar amounts like `$150.50` are fine, but edge cases with many decimal places could round incorrectly.

## Architecture Improvements

### 1. Add Model Validations

```ruby
class Expense < ApplicationRecord
  belongs_to :category
  validates :description, presence: true, length: { maximum: 255 }
  validates :amount, numericality: { greater_than: 0 }
  validates :date, presence: true
  validates :category_id, presence: true
end
```

### 2. Use Rails Serializers

Replace the manual `format_expense` with `active_model_serializers` or `jsonapi-serializer` for consistent JSON output.

### 3. Cache Categories on Frontend

Fetch categories once when the app loads and store them in context/state, rather than fetching on every expense creation.

### 4. Use `useMemo` for Category Breakdown

```tsx
const categoryData = useMemo(() => {
  return expenses.reduce((acc, expense) => { ... });
}, [expenses]);
```

### 5. Remove Unused Dependencies

Remove `react-router-dom` from `package.json` since it is not used. Remove or implement `QuickAddButton`.

### 6. Add API Pagination

```ruby
def index
  expenses = Expense.includes(:category).order(created_at: :desc)
  page = (params[:page] || 1).to_i
  per_page = (params[:per_page] || 50).to_i
  expenses = expenses.offset((page - 1) * per_page).limit(per_page)
  render json: expenses.map { |expense| format_expense(expense) }
end
```

### 7. Fix the init.sql vs Migration Conflict

Either:
- Remove `payer_name` from `init.sql` and let Rails migrations create the schema
- Or add the `date` column to `init.sql` and ensure it matches the migration

### 8. Separate Seed Data from Docker Startup

Remove `rails db:seed` from the Docker command so it only runs once (or manually), preventing data loss on container restart.
