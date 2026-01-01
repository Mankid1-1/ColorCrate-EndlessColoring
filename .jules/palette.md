## 2025-12-22 - [Destructive Action Confirmation]
**Learning:** Users often click icon-only buttons accidentally, especially on mobile or touch devices. Immediate deletion without confirmation is a poor UX pattern for destructive actions.
**Action:** Implement a "two-tap" confirmation pattern for small delete buttons instead of a full modal. The first click changes the button state (color/text) to "Confirm?", and the second click executes the action. Reset the state on blur or timeout to prevent "stale" confirmation states. This is faster than a modal but safer than a direct click.

## 2025-12-30 - [Auto-Focus on Helper Actions]
**Learning:** When users click helper buttons that populate input fields (like "Clear", "Randomize", or "Inspiration Prompts"), their intent is almost always to immediately type or edit the content. Leaving focus on the button forces an extra tap to focus the input, breaking the flow.
**Action:** Use `useRef` to programmatically focus the associated input field immediately after these helper actions occur. This creates a seamless "click-to-edit" flow that feels faster and more intuitive.

## 2025-01-01 - [Canvas Keyboard Accessibility]
**Learning:** Power users expect standard keyboard shortcuts in creative tools (e.g., Delete to remove items, Undo/Redo shortcuts), but simple `window.addEventListener` logic can accidentally trigger these actions when users are typing in text inputs, causing frustration and data loss.
**Action:** When implementing global keyboard shortcuts, always include a guard clause that checks `document.activeElement` to ignore the event if the user is focused on an `INPUT`, `TEXTAREA`, or an element with `contentEditable`. This ensures shortcuts only trigger when the user's intent is to interact with the canvas/editor itself.
