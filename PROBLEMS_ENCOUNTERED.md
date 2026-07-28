# Problems Encountered & Fixes Applied

During initial setup and debugging of the expense tracking application.

---

## 1. Backend Container Crashes on Startup

**Symptom:** `docker compose up` starts DB and frontend successfully, but backend exits immediately. Logs show:

```
Mysql2::Error: Duplicate key name 'index_categories_on_name'
```

**Root Cause:** `db/init.sql` (run by MySQL on first boot via Docker entrypoint) creates a UNIQUE KEY explicitly named `index_categories_on_name` on `categories.name`. The Rails migration `20260218000001_create_categories.rb` then calls `add_index :categories, :name, unique: true`, which also uses `index_categories_on_name` as the default index name. MySQL rejects the duplicate index name, causing the migration to fail. Since `docker-compose.yml` runs `rails db:migrate && rails db:seed && rails server` as a single chained command, the server never starts.

**Execution order:** `init.sql` runs during MySQL container initialization → tables already exist when Rails starts → migrations run but collide with existing index name.

**Fix:** Renamed the UNIQUE KEY in `db/init.sql` from `index_categories_on_name` to `uk_categories_name` so it no longer collides with the migration-generated index name.

```sql
-- Before (init.sql line 12)
UNIQUE KEY index_categories_on_name (name)

-- After
UNIQUE KEY uk_categories_name (name)
```

**Key Lesson:** When a Docker setup uses both SQL init scripts and Rails migrations, index names must not collide. The init script runs first (bootstrapping the DB), then Rails migrations run on top.

---

## 2. `schema.rb` Stale — Missing `date` Column, Has Phantom `payer_name`

**Symptom:** `schema.rb` (the canonical Rails schema file) listed `payer_name` on the expenses table and was missing the `date` column. However, the actual migration `20260218000002_create_expenses.rb` creates `date` and does not create `payer_name`.

**Root Cause:** `schema.rb` was generated from the original `init.sql` schema (which had `payer_name` and no `date`), then never regenerated after the migration was written. Rails uses `schema.rb` for `db:schema:load` — if it's wrong, new databases get the wrong structure.

**Fix:** Regenerated `schema.rb` by running `rails db:schema:dump` inside the container. The regenerated file now correctly shows:
- `date DATE NOT NULL` on expenses
- No `payer_name` column
- Correct index definitions

**Key Lesson:** `schema.rb` is auto-generated but can drift from actual migrations if not regenerated. Always trust migrations as the source of truth; regenerate `schema.rb` with `rails db:schema:dump`.

---

## 3. Factory Defaults Conflict with DB Schema

**Symptom:** `spec/factories/expenses.rb` defined `category { nil }` and included `payer_name { "MyString" }`, both of which conflict with the actual DB schema (NOT NULL foreign key on `category_id`, no `payer_name` column).

**Root Cause:** The factory was written to match the original `init.sql` schema (which had `payer_name`, no `date`, and allowed null categories), not the Rails migration schema.

**Fix:** Updated the factory to match the migration:
```ruby
# Before
factory :expense do
  description { "MyString" }
  amount { "9.99" }
  category { nil }
  payer_name { "MyString" }
end

# After
factory :expense do
  description { Faker::Commerce.product_name }
  amount { rand(1.0..500.0).round(2) }
  date { Faker::Date.backward(days: 30) }
  category
end
```

Changes:
- Removed `payer_name` (column doesn't exist in migration)
- Added `date` (required NOT NULL column from migration)
- Changed `category { nil }` to `category` (auto-associates via FactoryBot, satisfies NOT NULL FK)
- Used Faker for realistic test data

**Key Lesson:** Factories must match the actual DB constraints, not a stale schema definition. `category { nil }` would cause foreign key violations in tests.

---

## 4. Frontend Docker Container Crashes — Rollup Native Module Failure

**Symptom:** Frontend container exits with a native module compilation error from `rollup`, a Vite dependency. The error indicates the rollup binary was built for a different platform/architecture.

**Root Cause:** The `frontend_node_modules` Docker volume contained a pre-built `node_modules` directory from a previous `npm install` on a different platform (or host OS). Native modules like rollup's binding are platform-specific — binaries compiled on Windows don't work in a Linux container.

**Fix:** Delete the `frontend_node_modules` volume and `package-lock.json`, then rebuild:
```bash
docker compose down -v
docker volume rm expense_system_rails_frontend_node_modules
# Also delete from host
rm -rf frontend/node_modules frontend/package-lock.json
docker compose up --build
```

This forces a fresh `npm install` inside the Linux container, building native modules for the correct platform.

**Key Lesson:** Named Docker volumes persist across rebuilds. If `node_modules` was installed on the host (Windows) but mounted into a Linux container, native binaries won't work. Always clean volumes when switching platforms.

---

## 5. `init.sql` Seed Data Mismatch — Wrong Categories

**Symptom:** `init.sql` seeded 5 categories (`Food, Transport, Supplies, Entertainment, Utilities`) but the Rails `seeds.rb` and frontend `categories.ts` both use 10 different categories (`Food, Transportation, Shopping, Entertainment, Bills, Healthcare, Education, Travel, Personal, Other`).

**Root Cause:** `init.sql` was written with a simplified/different category set than what the rest of the application expects. Since Docker uses `init.sql` to bootstrap the DB (and `if_not_exists: true` in migrations means tables aren't recreated), the wrong categories persist.

**Fix:** Aligned `init.sql` categories to match `seeds.rb` and frontend:
```sql
-- Before
INSERT INTO categories (name) VALUES
  ('Food'), ('Transport'), ('Supplies'), ('Entertainment'), ('Utilities')

-- After
INSERT INTO categories (name) VALUES
  ('Food'), ('Transportation'), ('Shopping'), ('Entertainment'), ('Bills'),
  ('Healthcare'), ('Education'), ('Travel'), ('Personal'), ('Other')
```

**Key Lesson:** When multiple data sources define the same reference data, they must stay in sync. The `init.sql` is the actual source of truth in Docker since it runs first.

---

## 6. `init.sql` Expenses Missing `date` Column

**Symptom:** Seed expenses in `init.sql` were inserted without `date` values, but the migration defines `date DATE NOT NULL`.

**Root Cause:** The original `init.sql` was written for a schema without `date` (using `payer_name` instead). When the migration added `date NOT NULL`, the seed INSERTs would fail.

**Fix:** Added `date` column to the INSERT statement and aligned to span Jan 2026:
```sql
INSERT INTO expenses (description, amount, date, category_id) VALUES
  ('Team Lunch at Italian Restaurant', 1500.50, '2026-01-15', 1),
  ...
```

---

## 7. BUG-001 — Expenses Sorted by `created_at` Instead of `date`

**Symptom:** Expenses appear in creation order, not in the date the user recorded. If a user enters an expense for yesterday after entering one for today, it appears below instead of in chronological date order.

**Root Cause:** In `backend/app/controllers/api/expenses_controller.rb:3`:
```ruby
expenses = Expense.includes(:category).order(created_at: :desc)
```
Also, the date filter on line 12 queries `created_at` instead of `date`:
```ruby
expenses = expenses.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
```

**Status:** Identified but not yet fixed. Fix requires changing both the sort order and the date filter to use the `date` column instead of `created_at`.

---

## 8. Edit Expense Sends Category Name Instead of ID

**Symptom:** Editing an expense fails silently — the category doesn't update.

**Root Cause:** In `frontend/src/services/api.ts`, the `updateExpense` function sends the raw form data which contains `category` (the name string), but the backend expects `category_id` (an integer). The `createExpense` function correctly converts name→id, but `updateExpense` does not.

**Status:** Identified but not yet fixed. Fix requires the same name→id lookup in `updateExpense`.

---

## Summary of Fixes Applied

| # | Problem | Fix |
|---|---------|-----|
| 1 | Backend crashes: duplicate index name | Renamed UNIQUE KEY in `init.sql` |
| 2 | `schema.rb` stale | Regenerated with `rails db:schema:dump` |
| 3 | Factory defaults wrong | Updated to match migration schema |
| 4 | Frontend native module crash | Cleaned Docker volume + `node_modules` |
| 5 | Seed categories mismatched | Aligned `init.sql` to match `seeds.rb` |
| 6 | Seed expenses missing `date` | Added `date` values to INSERT |
