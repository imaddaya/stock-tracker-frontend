# Verification

Use Node.js 24 and the committed lockfile:

```bash
npm ci
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000 in .env.local.
npm run lint
npx tsc --noEmit --incremental false
npm run build
npx playwright install chromium
npm run test:e2e
```

On Linux CI, use `npx playwright install --with-deps chromium` to install browser system dependencies too. GitHub Actions performs these checks on pushes and pull requests.

The five Playwright scenarios mock the verification/deletion API responses. They test explicit confirmation, successful deletion while signed in as the same account, another account, or signed out, and preservation of data after a rejected deletion. They do not prove the real backend, email delivery, database, or Alpha Vantage integration works.

The deletion token is decoded for browser storage cleanup only after the backend has accepted it. Browser decoding is not signature verification. The backend remains responsible for checking its type, signature, expiry and password fingerprint.

For a real integration check, run the backend from its [setup guide](https://github.com/imaddaya/stock-tracker-backend), configure matching frontend/backend origins, register a test account, confirm the actual email link, add a portfolio stock, and delete that test account through its emailed confirmation link. Use disposable test data.

If `next build` stops with `uv_resident_set_memory`, check `node -e 'console.log(process.memoryUsage())'`. A failure in that standalone command is a runtime/environment problem. Retry on a normal Node installation or the GitHub Actions runner; do not bypass compilation checks or alter application logic to hide it. If the browser download is truncated, retry the browser installation on a connection that can reach Playwright's download hosts.
