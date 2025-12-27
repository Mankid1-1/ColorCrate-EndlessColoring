## 2025-12-23 - CRITICAL: Hardcoded API Key in Repository
**Vulnerability:** A valid Google Gemini API key (`VITE_GEMINI_API_KEY`) was found in `.env.local` which is tracked by the git repository.
**Learning:** Even if files are in `.gitignore`, they can still be tracked if they were added before the ignore rule was created or force-added. Relying solely on `.gitignore` is insufficient for secret management.
**Prevention:**
1. Use `git ls-files` to audit tracked files for secrets.
2. Use secret scanning tools (like TruffleHog or Gitleaks) in CI/CD.
3. Ensure local development environment files (like `.env.local`) are strictly untracked using `git rm --cached`.

## 2025-12-27 - Explicitly Disabled CSP for Developer Convenience
**Vulnerability:** `helmet` was used in `server/index.js` but `contentSecurityPolicy` was explicitly set to `false` to support external CDNs and inline scripts.
**Learning:** Developers often disable CSP entirely to avoid dealing with whitelisting CDNs (Tailwind, Fonts) and inline scripts, leaving the app vulnerable to XSS.
**Prevention:** Configure CSP with specific allow-lists for necessary CDNs (e.g., `cdn.tailwindcss.com`, `fonts.googleapis.com`) and use `'unsafe-inline'` cautiously (or nonces/hashes) instead of disabling CSP entirely.
