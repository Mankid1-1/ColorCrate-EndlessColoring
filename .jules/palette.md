## 2025-12-22 - [Destructive Action Confirmation]
**Learning:** Users often click icon-only buttons accidentally, especially on mobile or touch devices. Immediate deletion without confirmation is a poor UX pattern for destructive actions.
**Action:** Implement a "two-tap" confirmation pattern for small delete buttons instead of a full modal. The first click changes the button state (color/text) to "Confirm?", and the second click executes the action. Reset the state on blur or timeout to prevent "stale" confirmation states. This is faster than a modal but safer than a direct click.
