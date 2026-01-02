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

## 2026-01-02 - Hidden Backend Vulnerabilities
**Vulnerability:** High severity DoS vulnerability in `qs` (transitive dependency) found in `server/` directory.
**Learning:** `server/` has its own `package-lock.json` and dependencies which are easily overlooked when scanning the root.
**Prevention:** Include `cd server && npm audit` in the project's security scanning or CI pipeline.
