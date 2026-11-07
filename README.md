# Madrasa Miftah ul Uloom

A production-ready multilingual (English, Urdu, Arabic) website, administration system, student/guardian/teacher portal and Islamic bookstore for Madrasa Miftah ul Uloom.

## Contents

- Public website: home, about, programmes, faculty, facilities, mission, gallery, events, announcements, FAQs, contact and policy pages.
- Admissions: public application form, reference + PIN tracking, admin review and approval into student records.
- Bookstore: catalogue, cart, checkout (cash on delivery / bank transfer), order tracking and printable receipts.
- Portals: role-aware dashboards for students, guardians, teachers and customers; attendance, results, fees and notifications.
- Administration: dashboard, admissions, students, academics, finance, inventory, orders, content, users, audit log, settings and notifications.
- Security: session cookies, Argon2id password hashing, role guards, rate limiting, Helmet headers, input validation and upload checks.

Online card payment is intentionally not integrated; orders use cash on delivery or manual bank transfer. Fee payments are recorded by administrators.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, React Hook Form, Zod, Recharts |
| Backend | Node.js, Express 4, Mongoose 8, Zod, JWT session cookie |
| Database | MongoDB (production) or persistent local `mongodb-memory-server` (development) |
| Tests | Vitest + Supertest integration tests |

## Repository layout

```text
.
├── backend/            Express API, models, routes, seed and tests
├── frontend/           Next.js application
├── assets/             Source branding assets
├── package.json        npm workspaces and root scripts
└── prompt.txt          Original requirements brief
```

## Requirements

- Node.js 20.19 or newer (Node 22/24 recommended)
- npm 10 or newer
- MongoDB 7.x/8.x for production; development can use the bundled persistent memory server

## Quick start (development)

```powershell
npm install
Copy-Item backend/.env.example backend/.env

# Create a session secret and put it in backend/.env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Seed the database (choose a strong password here)
$env:SEED_ADMIN_PASSWORD="ChangeMe-Strong-Password-123"
npm run seed

npm run dev
```

Open:

- Website: <http://localhost:3000>
- API health: <http://localhost:4000/api/health>
- Admin: <http://localhost:3000/admin>
- Portal: <http://localhost:3000/portal>

Seeding writes one-time credentials and demo admission tracking PINs to `backend/.seed-credentials.txt`. Move them to a password manager and delete the file. Demo content, finance records and catalogue entries are samples and must be reviewed before launch.

Run only one side when needed:

```powershell
npm run dev:backend
npm run dev:frontend
```

## Root scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run API and website with hot reload |
| `npm run seed` | Seed settings, demo data and admin account |
| `npm test` | Backend integration tests (isolated temporary DB) |
| `npm run typecheck` | TypeScript checks for both workspaces |
| `npm run lint` | Frontend ESLint |
| `npm run build` | Production build for API and website |
| `npm start` | Start both production builds |

## Environment

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test` or `production` |
| `PORT` | API port (default `4000`) |
| `MONGODB_URI` | Production MongoDB connection string. When set, in-memory mode is disabled |
| `USE_IN_MEMORY_DB` | Use persistent local MongoDB in development (default `true`) |
| `IN_MEMORY_DB_PATH` | Local database directory (default `.data/mongo`) |
| `MONGOMS_VERSION` | Optional `mongodb-memory-server` binary version |
| `MONGOMS_SYSTEM_BINARY` | Optional absolute path to an existing `mongod` executable |
| `SESSION_SECRET` | Required signing secret, at least 16 characters |
| `SESSION_DAYS` | Session lifetime in days |
| `FRONTEND_URL`, `CORS_ORIGINS` | Allowed browser origins |
| `API_BASE_URL` | Public API base URL |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | One-time admin bootstrap |
| `SEED_DEMO` | Include sample students, finance and catalogue data |
| `UPLOAD_STORAGE_PATH`, `MAX_UPLOAD_MB` | Upload directory and size limit |
| `DEFAULT_SHIPPING_FEE`, `DEFAULT_FREE_SHIPPING_ABOVE` | Initial store shipping settings |

### Frontend

| Variable | Purpose |
| --- | --- |
| `API_INTERNAL_URL` | Backend target for `/api` and `/uploads` rewrites (default `http://localhost:4000`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public site URL used in metadata |
| `NEXT_PUBLIC_LOGO_URL` | Optional logo override for the home page |

## Local database notes

Development does not require a MongoDB installation. `mongodb-memory-server` starts a local `mongod` and keeps data in `backend/.data/mongo` between runs. Delete that directory to start fresh, then seed again.

On older Windows 10 CPUs without AVX2 (for example Intel Ivy Bridge), MongoDB 8.x can crash with `UnexpectedCloseError ... code "14"` when reopening an existing data directory. Use MongoDB 7.0.x instead:

1. Download MongoDB Community Server 7.0.x for Windows x64 or a prebuilt 7.0.x `mongod.exe`.
2. Place it outside source control, for example `backend/.mongo/bin/mongod.exe`.
3. Set in `backend/.env`:

```dotenv
MONGOMS_VERSION=7.0.37
MONGOMS_SYSTEM_BINARY=C:/absolute/path/to/backend/.mongo/bin/mongod.exe
```

4. Delete the old corrupt data directory (`backend/.data/mongo`) and re-seed.

`.mongo/` and `.data/` are ignored by git.

## Tests

```powershell
npm test
```

The suite starts an isolated database under `.data/vitest-<pid>`, seeds fixtures and removes it afterwards. It covers public endpoints, authentication and role guards, every admin collection, admissions approval, order checkout and stock restoration, invoices/payments/reversals, portal visibility and teacher attendance.

## Production deployment

1. Provision MongoDB with a dedicated least-privilege user and enable authentication and backups.
2. Set `NODE_ENV=production`, a real `MONGODB_URI`, a strong `SESSION_SECRET`, correct `FRONTEND_URL`/`CORS_ORIGINS` and `API_BASE_URL` in `backend/.env`.
3. Set `API_INTERNAL_URL` and `NEXT_PUBLIC_SITE_URL` for the frontend build.
4. Build and start:

```powershell
npm ci
npm run build
$env:SEED_ADMIN_PASSWORD="..."
npm run seed
npm start
```

5. Terminate TLS at a reverse proxy (Nginx, Caddy, IIS ARR or a platform load balancer) and forward `/api` and `/uploads` to the API port. The web app already proxies these paths through `API_INTERNAL_URL`.
6. Persist `backend/uploads` and `backend/.data` (only if using local mode). Production refuses to start with in-memory mode.
7. Back up MongoDB and uploaded files. Restrict database network access to the API host.
8. Save the generated admin credentials securely, delete `backend/.seed-credentials.txt`, and remove demo records before launch.
9. Replace placeholder branding (`frontend/public/branding/emblem-placeholder.svg`), sample copy and contact details through Admin → Settings and Content.

Set `trust proxy` at the reverse proxy and serve over HTTPS so session cookies are sent securely in production.

## Admin access

After seeding, sign in at `/admin` with `SEED_ADMIN_EMAIL` and the password supplied through `SEED_ADMIN_PASSWORD` (or the generated password printed once and written to `.seed-credentials.txt`).

Roles:

- `super_admin` - full administration.
- `teacher` - assigned classes, attendance and results.
- `student` / `guardian` - portal access to attendance, results, fees and notifications.
- `customer` - bookstore orders and profile.

## Troubleshooting

- **`npm` is blocked in PowerShell**: run commands through `cmd /c "npm ..."` or adjust the execution policy.
- **`Invalid environment configuration`**: ensure `backend/.env` exists and `SESSION_SECRET` is at least 16 characters.
- **MongoDB exits with code 14 / `0xC000001D`**: see the MongoDB 7.0.x workaround above and remove the corrupted data directory.
- **Build runs out of memory or times out**: close other applications or raise the Node heap (`$env:NODE_OPTIONS="--max-old-space-size=4096"`).
- **Ports 3000/4000 already in use**: stop the conflicting process or change `PORT` and the frontend proxy target.
- **Login works but API calls fail**: check `CORS_ORIGINS`, `FRONTEND_URL`, cookies in the browser and that the API is reachable at `API_INTERNAL_URL`.
- **Uploads disappear after redeploy**: mount `backend/uploads` as persistent storage.
