## 2025-12-23 - CRITICAL: Hardcoded API Key in Repository
**Vulnerability:** A valid Google Gemini API key (`VITE_GEMINI_API_KEY`) was found in `.env.local` which is tracked by the git repository.
**Learning:** Even if files are in `.gitignore`, they can still be tracked if they were added before the ignore rule was created or force-added. Relying solely on `.gitignore` is insufficient for secret management.
**Prevention:**
1. Use `git ls-files` to audit tracked files for secrets.
2. Use secret scanning tools (like TruffleHog or Gitleaks) in CI/CD.
3. Ensure local development environment files (like `.env.local`) are strictly untracked using `git rm --cached`.

## 2025-12-26 - Content Security Policy Enabled
**Vulnerability:** The application was running with `contentSecurityPolicy: false` in Helmet, exposing it to Cross-Site Scripting (XSS) and other injection attacks.
**Learning:** CSP is essential but can be difficult to implement with modern frontend tools (Vite, Tailwind) that rely on inline styles or scripts. The existing architecture used CDNs for core libraries (Tailwind, React), requiring a permissive policy.
**Prevention:** Enabled CSP with `helmet` but configured it to:
1. Allow specific CDNs (`cdn.tailwindcss.com`, `aistudiocdn.com`, `fonts.googleapis.com`).
2. Allow `'unsafe-inline'` for scripts and styles to support the current build process and Tailwind configuration.
3. Allow `data:` images for generated content.
Future improvements should aim to remove `'unsafe-inline'` by using nonces or hashes, but this requires changes to the build pipeline.

## 2026-01-03 - Strict CORS Policy Enforced
**Vulnerability:** The Express backend was using `cors()` with default settings, which sets `Access-Control-Allow-Origin: *`. This permitted any website (including malicious ones) to make requests to the API, potentially leading to resource exhaustion (DoS) or misuse of the API key quota via the user's browser.
**Learning:** Even for internal APIs or prototypes, permissive CORS (`*`) is a significant risk if the API server is reachable by third parties (e.g., via localhost binding on a user's machine while they browse other sites).
**Prevention:** Implemented a whitelist-based CORS policy in `server/index.js` that checks the `Origin` header against `process.env.ALLOWED_ORIGINS` or a safe default list (Vite dev, Capacitor).
