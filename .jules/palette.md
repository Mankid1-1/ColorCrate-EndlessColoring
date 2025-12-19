## 2025-12-19 - [Fixing Div Buttons]
**Learning:** Found a critical accessibility anti-pattern where a `div` was used as a clickable element for the main logo navigation. This made the primary way to return to the library inaccessible to keyboard users.
**Action:** Always check `onClick` handlers on `div` or `span` elements. Convert them to semantic `<button>` elements or standard `<a>` links to ensure keyboard focusability and screen reader support without needing extra ARIA attributes like `role="button"` and `tabIndex`.
