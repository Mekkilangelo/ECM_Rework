# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Synergia ECM Monitoring** is a web application for managing and monitoring industrial thermal treatment processes (cémentation/carburizing). It provides hierarchical tracking of clients → orders → parts → trials (tests) with file management, automated PDF report generation, and analytical dashboards.

**Stack:**
- Frontend: React 19 + React Router + Bootstrap
- Backend: Node.js + Express + Sequelize ORM
- Database: MySQL 8.0
- Authentication: JWT with refresh tokens
- Deployment: Docker + Docker Compose + Nginx (reverse proxy with SSL)

## Development Commands

### Backend (server/)
```bash
cd server
npm install              # Install dependencies
npm run dev              # Start development server with nodemon (port 5001)
npm start                # Start production server

# Testing
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:all         # Run all tests
npm run test:watch       # Watch mode for tests
npm run test:coverage    # Generate coverage report

# Database utilities
npm run db:clean         # Clean database
npm run workflow         # Full workflow test

# ETL scripts (data loading)
npm run etl:help         # Show ETL help
npm run etl:validate     # Validate ETL data
npm run etl:load         # Load data
```

### Frontend (client/)
```bash
cd client
npm install              # Install dependencies
npm start                # Start development server (port 3000)
npm run build            # Build for production
npm test                 # Run tests
```

### Docker Development
```bash
# Development environment (with hot reload)
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f

# Production environment
docker compose -f docker-compose.prod.yml up -d
```

### Deployment
```bash
./deploy.sh              # Deploy to production (loads images, starts services, generates SSL certs)
./rollback.sh            # Rollback to previous version
./validate-bundle.sh     # Validate release bundle before deployment
```

## Architecture & Code Organization

### Data Model Hierarchy

The application follows a strict hierarchical data model using a `nodes` table for universal tree structure:

1. **Client** (top level)
2. **Order** (closure/commande) - belongs to Client
3. **Part** (pièce) - belongs to Order
4. **Trial** (test/essai) - belongs to Part

**Key concept:** All entities are stored as nodes in the `nodes` table with `type`, `parent_id`, and hierarchical metadata. Type-specific data is stored in related tables (`clients`, `closures`, `parts`, `trials`) with `node_id` as the primary key referencing `nodes.id`.

### Backend Structure (server/)

```
server/
├── app.js              # Express app configuration (middleware, routes, error handling)
├── server.js           # Main entry point (starts server, DB initialization)
├── config/             # Configuration (database singleton)
├── startup/            # Application startup modules
│   ├── database.js     # DB initialization & sync
│   ├── middleware.js   # Middleware setup
│   ├── routes.js       # Route mounting
│   └── graceful-shutdown.js
├── models/             # Sequelize models (auto-loaded via models/index.js)
│   ├── index.js        # Model loader & associations
│   ├── node.js         # Core hierarchical node model
│   ├── client.js       # Client-specific data
│   ├── closure.js      # Order/closure data
│   ├── part.js         # Part data
│   ├── trial.js        # Trial/test data
│   └── recipe*.js      # Recipe models for thermal cycles
├── routes/             # Express route handlers
│   ├── hierarchy.js    # CRUD for hierarchical nodes
│   ├── trials.js       # Trial-specific operations
│   ├── reports.js      # PDF report generation
│   ├── files.js        # File upload/download
│   └── search.js       # Advanced search
├── controllers/        # Request handlers (business logic delegation)
├── services/           # Business logic layer
│   ├── trialService.js # Trial operations (largest service)
│   ├── reportService.js # PDF generation with signatures
│   ├── fileService.js  # File management
│   └── storage/        # Storage adapters
├── middleware/         # Custom middleware (auth, logging, validation)
└── utils/              # Utilities (logger, validators)
```

### Frontend Structure (client/src/)

```
client/src/
├── App.js              # Main app component (routing, providers)
├── pages/              # Top-level page components
│   ├── Dashboard.jsx   # Main dashboard with analytics
│   ├── Reference.jsx   # Reference data management
│   ├── TrialSearch.jsx # Advanced trial search
│   └── UserManagement.jsx
├── components/         # Reusable components
│   ├── layout/         # Layout components (Sidebar, Navbar)
│   ├── common/         # Shared UI components
│   ├── dashboard/      # Dashboard-specific components
│   ├── reference/      # Reference table components
│   └── search/         # Search components
├── features/           # Feature-specific modules
│   └── reports/        # PDF report generation components
├── services/           # API communication
│   ├── api.js          # Axios instance with interceptors
│   ├── authService.js  # Authentication service
│   ├── hierarchyService.js # Node hierarchy operations
│   └── trialService.js # Trial operations
├── context/            # React context providers
│   ├── AuthContext.jsx # Authentication state
│   ├── ThemeContext.jsx # Dark/light theme
│   └── NavigationContext.jsx
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── locales/            # i18n translations (fr, en)
```

### Key Architectural Patterns

**Backend:**
- **Singleton Database:** `config/database.js` provides a single Sequelize instance used throughout the app
- **Model Auto-loading:** `models/index.js` automatically loads all models and sets up associations
- **Service Layer:** Business logic is in services, controllers delegate to services
- **Centralized Error Handling:** `middleware/error-handler.js` catches all errors
- **Winston Logging:** Structured logging via `utils/logger.js`

**Frontend:**
- **Context Providers:** Auth, Theme, Navigation contexts wrap the app
- **API Layer:** Centralized axios instance in `services/api.js` with auth interceptors
- **Protected Routes:** `PrivateRouteComponent` in `App.js` guards authenticated routes
- **i18n:** Translations via react-i18next (French/English)

## Database Schema Notes

**Node Hierarchy:**
- `nodes` table stores all entities with `type` field ('client', 'closure', 'part', 'trial')
- Type-specific tables use `node_id` as PK (FK to `nodes.id`)
- Navigation uses `parent_id` in nodes table

**Reference Tables:**
- Many fields use FK to reference tables (e.g., `ref_status`, `ref_location`, `ref_units`)
- **Important:** Status, location, units are stored as string FKs to `name` column, not IDs

**Trial/Recipe Relationship:**
- Trials reference recipes via `recipe_id`
- Recipes contain thermal cycle data (chemical cycles, thermal steps, cooling parameters)
- Recipe chemical cycles include fields: `wait_gas`, `wait_flow` for gas/flow waiting times

## Testing

**Backend tests** use Jest + Supertest:
- Unit tests: `server/tests/unit/` (isolated component tests)
- Integration tests: `server/tests/integration/` (full API tests with DB)
- Test environment uses separate test database
- Run with `npm run test:unit` or `npm run test:integration`

**Test structure:**
- `tests/helpers/` - Test utilities
- `tests/mocks/` - Mock data
- `tests/config/` - Test configuration

## CI/CD Workflows

Located in `.github/workflows/`:

**local.yml** (Dev branch):
- Triggers on push/PR to `dev`
- Builds Docker images
- Runs unit and integration tests
- Deploys to local dev environment
- Uses self-hosted Windows runner

**release.yml** (Main branch):
- Triggers on push to `main`
- Builds production Docker images
- Saves all images to single bundle: `images/all-images.tar`
- Creates release artifacts with `deploy.sh`, `rollback.sh`, `validate-bundle.sh`

## Important Implementation Notes

### File Management
- Uploads stored in `server/uploads/` directory
- File service handles image compression via Sharp
- Multiple files per trial/part supported
- File metadata stored in `files` table with references to nodes

### Report Generation
- PDFs generated server-side via `reportService.js`
- Includes electronic signatures, QR codes, thermal cycle visualizations
- Reports use SVG for thermal cycle diagrams with arrows
- Recent improvement: Fixed section ordering and loading UI

### Authentication
- JWT tokens with configurable expiry (`JWT_EXPIRE`)
- Inactivity timeout (`JWT_INACTIVITY_EXPIRE`)
- Refresh token mechanism
- Frontend stores token in localStorage, auto-attached via axios interceptor

### Environment Variables
Key variables (see `.env.example`):
- `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` - Database credentials
- `JWT_SECRET` - Token signing key
- `CLIENT_URL`, `API_URL` - Frontend/backend URLs
- `DB_SYNC_ALTER` - Sequelize sync mode (use `true` in dev, `false` in prod)

### Deployment Flow
1. Code pushed to `dev` → CI runs tests
2. Merge to `main` → Release workflow creates bundle with Docker images
3. Bundle extracted on server → `./deploy.sh` loads images and starts services
4. Nginx proxies requests to frontend:3000 and backend:5001/api
5. SSL certificates auto-generated (self-signed) or use provided certs

## Common Patterns

### Adding a new field to Trial model:
1. Update `server/models/trial.js` with new field definition
2. Add to associations if it's a FK
3. Update `server/services/trialService.js` to handle new field
4. Update frontend forms in trial components
5. Run `npm run workflow` to test DB sync

### Creating a new API endpoint:
1. Add route in `server/routes/[entity].js`
2. Create controller method in `server/controllers/[entity]Controller.js`
3. Implement business logic in `server/services/[entity]Service.js`
4. Add corresponding service method in `client/src/services/[entity]Service.js`
5. Add tests in `server/tests/integration/`

### Adding i18n translations:
1. Add keys to `client/src/locales/fr/translation.json` and `en/translation.json`
2. Use `t('key.path')` in components via `useTranslation()` hook

## Version Control

**Branch strategy:**
- `dev` - Development branch (active development)
- `main` - Production branch (releases only)
- Feature branches: `feature/description`

**Commit conventions:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Test changes
- `docs:` - Documentation

Current version: 1.2.0 (as of package.json)
