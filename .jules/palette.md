## 2025-12-19 - [Fixing Div Buttons]
**Learning:** Found a critical accessibility anti-pattern where a `div` was used as a clickable element for the main logo navigation. This made the primary way to return to the library inaccessible to keyboard users.
**Action:** Always check `onClick` handlers on `div` or `span` elements. Convert them to semantic `<button>` elements or standard `<a>` links to ensure keyboard focusability and screen reader support without needing extra ARIA attributes like `role="button"` and `tabIndex`.

## 2025-05-23 - [Locked Feature Accessibility]
**Learning:** Disabled buttons with child interactive elements (like an overlay click handler) block keyboard users from accessing the upgrade path and are confusing for screen readers. A disabled button is a dead end.
**Action:** When a feature is "locked" but clicking it triggers an upgrade modal, do NOT use `disabled`. Instead, keep the button enabled, use a clear `aria-label` (e.g., "Unlock X with Pro"), and handle the logic in the `onClick` handler. This makes the upsell accessible to everyone.
