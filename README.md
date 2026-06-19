# Backend Ledger

Lightweight backend for a ledger system (accounts, transactions, email alerts).

## Features
- User registration, login and logout (JWT + cookies)
- Create and list user accounts
- Create idempotent transactions with ledger entries (DEBIT/CREDIT)
- System-only endpoint to credit initial funds
- Email notifications (uses Gmail SMTP)

## Project structure

- `server.js` - app bootstrap and DB connection
- `src/app.js` - Express app and route mounting
- `src/config/db.js` - MongoDB connection (reads `MONGO_URI`)
- `src/routes` - route definitions
- `src/controllers` - request handlers
- `src/models` - Mongoose models (users, accounts, ledger, transactions)
- `src/services/email.service.js` - email helpers (requires `EMAIL_USER`/`EMAIL_PASS`)

## Prerequisites
- Node.js (16+ recommended)
- MongoDB instance (Atlas or local)

## Environment variables
Create a `.env` file in the project root with at least:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - secret used to sign JWT tokens
- `EMAIL_USER` - Gmail address used to send emails
- `EMAIL_PASS` - Gmail app password (or account password if allowed)

Example `.env`:

--> MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example/dbname

--> JWT_SECRET=your_jwt_secret_here

--> EMAIL_USER=youremail@gmail.com

--> EMAIL_PASS=your_email_password_or_app_password

## Install

Install dependencies:

```bash
npm install
```

## Run

Start in dev mode (nodemon):

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

The server listens on port `3000` by default.

## API Endpoints

Base paths are mounted in `src/app.js`:

- Auth: `POST /api/auth/*`
- Accounts: `GET|POST /api/accounts/*` (protected)
- Transactions: `POST /api/transactions/*` (protected)

### Auth
- `POST /api/auth/register` - Register a new user
  - Body: `{ "email": "user@ex.com", "password": "pass", "name": "Full Name" }`
  - Response includes `token` and sets `token` cookie

- `POST /api/auth/login` - Login
  - Body: `{ "email": "user@ex.com", "password": "pass" }`
  - Response includes `token` and sets `token` cookie

- `POST /api/auth/logout` - Logout (blacklists JWT and clears cookie)

### Accounts (protected)
- `POST /api/accounts/` - Create a new account for the logged-in user
  - No body required; returns the created account

- `GET /api/accounts/` - Get all accounts for the logged-in user

- `GET /api/accounts/balance/:accountId` - Get balance for an account

### Transactions (protected)
- `POST /api/transactions/` - Create a transaction
  - Body: `{ "fromAccount": "<id>", "toAccount": "<id>", "amount": 100, "idempotencyKey": "unique-key" }`
  - Idempotency: supply `idempotencyKey` to avoid duplicate processing

- `POST /api/transactions/system/initial-funds` - System-only endpoint
  - Requires the caller to be a system user (see `systemUser` flag on `User` model)
  - Body: `{ "toAccount": "<id>", "amount": 1000, "idempotencyKey": "unique-key" }`

## Notes & Behavior
- Authentication: JWT tokens are set as a `token` cookie and may also be supplied in the `Authorization: Bearer <token>` header.
- Token blacklisting: logout stores tokens in a blacklist collection to invalidate them.
- Transactions: the controller uses MongoDB transactions and creates ledger DEBIT and CREDIT entries. There is an intentional short delay in processing the second ledger entry (simulates async processing) — see `src/controllers/transaction.controller.js`.
- Emails: registration and transaction notifications are sent via Gmail. Ensure `EMAIL_USER` and `EMAIL_PASS` are set and the account allows SMTP access.

## Development & Testing
- Run the dev server: `npm run dev`
- There are no automated tests included in this repo (the `test` script is a placeholder).
