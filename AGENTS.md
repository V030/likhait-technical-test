# AGENTS.md

## Project Structure

Monorepo with two independent apps:
- `backend/` — Rails 7.2 API-only (Ruby 3.3.7, MySQL 8.0, RSpec)
- `frontend/` — React 18 + TypeScript 5.3 + Vite 5.1 (custom "Vibes" component library)

Both have their own Dockerfiles and run independently.

## Quick Commands

### Backend (`cd backend`)
```bash
bundle install                          # install gems
rails db:create db:migrate db:seed      # setup DB (MySQL must be running)
bundle exec rspec                       # run tests
bundle exec rubocop                     # lint (Rails Omakase style)
rails server                            # starts on :3000
```

Run a single spec file:
```bash
bundle exec rspec spec/requests/api/expenses_spec.rb
```

### Frontend (`cd frontend`)
```bash
npm install                             # install deps
npm run dev                             # Vite dev server on :5173
npm run build                           # typecheck (tsc) + production build
```

No frontend test runner is configured. No lint or format tool is configured.

### Docker (from repo root)
```bash
docker compose up                       # starts db + backend + frontend
docker compose exec backend bundle exec rspec   # tests in container
docker compose exec backend rails db:migrate    # run migrations in container
```

## Key Gotchas

- **Schema out of sync**: `db/schema.rb` is stale. The `expenses` migration creates a `date` column but `schema.rb` lists `payer_name` instead. Always trust migrations over `schema.rb`. Regenerate with `rails db:schema:dump` if needed.
- **No `payer_name` in migration**: The `expenses` migration does not create `payer_name`, but `schema.rb` and factories include it. The `payer_name` column exists in the DB (via `db/init.sql` used by Docker) but is not managed by Rails migrations.
- **CORS is wide open**: `config/initializers/cors.rb` allows all origins — development-only, never deploy this way.
- **Seed data is large**: `rails db:seed` generates ~2500+ expenses spanning Jan 2024–Feb 2026. It destroys existing data first.
- **API is namespaced**: All endpoints under `/api/` — `GET/POST/PUT/DELETE /api/expenses`, `GET /api/categories`.
- **Expense params**: Controller permits `:description, :amount, :category_id, :date` but NOT `:payer_name` (even though the DB column exists).

## Architecture Notes

- Backend is API-only (`ActionController::API`), no views/sessions.
- Models are minimal: `Expense belongs_to :category`, `Category has_many :expenses, dependent: :destroy`. No validations defined in models.
- Frontend uses inline styles throughout (no CSS framework, no Tailwind). Color constants in `src/constants/colors.ts`.
- Frontend custom component library lives in `src/vibes/` — use these instead of inventing new patterns.
- Frontend routes via `useState` in `App.tsx` (not react-router despite the dependency). Only `history` page exists.
- `VITE_API_URL` env var is set to `http://localhost:3000` but `api.ts` hardcodes the URL — env var is unused.

## Testing

- Backend: RSpec + FactoryBot + Faker + shoulda-matchers + database_cleaner.
- `spec/factories/` has defaults that may conflict with DB constraints (e.g. factory `expense` has `category: nil`).
- Tests use transactional fixtures (`use_transactional_fixtures = true`).
- No frontend tests exist.
