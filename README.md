# 📈 Stock Tracker Frontend

A Next.js frontend for a full-stack stock portfolio tracking application.

The application allows users to create an account, search for stocks, maintain a personal portfolio, view market data and historical charts, track basic profit/loss information, manage an Alpha Vantage API key, and configure email reminders.

The frontend communicates with a separate FastAPI backend.

## 🔗 Related Repository

Backend:

https://github.com/imaddaya/stock-tracker-backend

## ✨ Features

### 🔐 Authentication

- User registration and login
- Email verification
- Password reset through email
- JWT-based authenticated requests
- Account deletion confirmation
- Automatic redirect for unauthenticated users

### 📊 Stock Search and Portfolio

- Search stocks by ticker symbol or company name
- Paginated stock search results
- Add stocks to a personal portfolio
- Remove stocks from the portfolio
- Refresh individual stock market data
- View detailed information for each stock

### 📈 Stock Data Visualization

- Weekly stock data
- Monthly stock data
- Interactive chart points
- Detailed OHLC market information
- Volume and dividend information
- Horizontally scrollable charts for larger datasets

### 💰 Portfolio Tracking

Users can locally record:

- Number of shares owned
- Purchase price
- Estimated current position value
- Profit or loss
- Profit/loss percentage

Quantity and purchase-price information is currently stored in the browser using `localStorage`.

### ⚙️ Profile Settings

- View account information
- Update Alpha Vantage API key
- Masked API key display
- Configure email reminder settings
- Select reminder timezone
- Request a password reset
- Delete an account

## 🧰 Tech Stack

- Next.js 15
- React 19
- TypeScript
- ESLint
- Prettier
- Husky
- lint-staged

The application uses a shared API client for communication with the FastAPI backend.

## ✅ Prerequisites

Before running the frontend, install:

- Node.js
- npm
- Git

The backend should also be running locally.

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/imaddaya/stock-tracker-frontend.git
```

Move into the project directory:

```bash
cd stock-tracker-frontend
```

Install dependencies:

```bash
npm install
```

## 🌐 Environment Configuration

Copy the included environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env.local
```

The frontend requires:

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

Do not commit `.env.local`.

## ▶️ Running the Application

Make sure the FastAPI backend is running at:

```text
http://127.0.0.1:8000
```

Then start the frontend development server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

Using `127.0.0.1` consistently is recommended for local development because the backend CORS configuration must match the frontend origin.

## 🧪 Quality Checks

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

## 🗂️ Project Structure

```text
stock-tracker-frontend/
├── components/        Reusable React components
├── pages/             Next.js pages and application routes
├── public/            Static assets
├── styles/            Global and page styles
├── utils/             Shared utilities and API client
├── .env.example       Environment variable template
├── eslint.config.mjs  ESLint configuration
├── package.json       Scripts and dependencies
└── README.md
```

## 🔌 Backend Integration

Authenticated API requests are centralized through:

```text
utils/api.ts
```

The API client:

- Reads `NEXT_PUBLIC_BACKEND_URL`
- Adds the stored access token to authenticated requests
- Handles JSON responses
- Converts unsuccessful HTTP responses into errors

Major backend integrations include:

- Authentication
- User profile management
- Stock search
- Portfolio management
- Weekly and monthly stock data
- Email reminder settings

## 🔑 Alpha Vantage

Stock market data is provided through Alpha Vantage via the backend.

Each user can configure an Alpha Vantage API key from the profile page. The frontend does not display the complete stored key after it has been saved.

An Alpha Vantage API key can be obtained from:

https://www.alphavantage.co/

## 📧 Email Features

Email verification, password-reset messages, account-deletion confirmation, and portfolio reminders depend on the backend email configuration.

Scheduled reminder delivery is handled by the backend scheduler process rather than by the frontend.

## 🔒 Security Notes

- Environment-specific configuration is kept outside source control.
- `.env.local` is ignored by Git.
- `.env.example` contains only safe example configuration.
- Authenticated API calls use bearer access tokens.
- Stored Alpha Vantage API keys are displayed only in masked form.
- Sensitive backend credentials are never included in the frontend repository.

## 📄 License

This project is intended as a portfolio and educational project.
