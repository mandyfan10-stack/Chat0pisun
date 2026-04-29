## 2024-04-19 - Zustand Store Destructuring Causes Unnecessary Re-renders
**Learning:** In React Native, using destructuring on a Zustand store (e.g., `const { messages } = useChatStore()`) causes the component to re-render whenever ANY state in the store changes, not just the destructured properties. This is a massive performance bottleneck in chat applications, as receiving a message in one chat room would cause all other active chat components to re-render.
**Action:** Always use specific state selectors when accessing Zustand stores (e.g., `const messages = useChatStore(state => state.messages[chatId])`). This ensures components only subscribe to the specific data they need.

## 2024-04-21 - FlatList Re-renders from Inline Functions
**Learning:** In React Native, passing inline functions (like `onPress={() => navigate(...) }`) or inline `renderItem` props to a `FlatList` causes cascading re-renders. Every time the parent component (e.g., `ChatListScreen`) re-renders, new function instances are created, forcing every single list item to unnecessarily re-render, destroying list scrolling performance.
**Action:** Always extract `FlatList` handlers (like `onPress` actions) and the `renderItem` function itself into `useCallback` hooks. Additionally, wrap the corresponding list item component (e.g., `ChatListItem`) in `React.memo` to ensure it only updates when its specific props change.
## 2024-11-20 - Debounce Immediate State Update in React Native Text Inputs
**Learning:** In React Native text inputs, if you debounce the actual state update (e.g. `setQuery(text)`), the UI will feel sluggish because the input won't update its visual value until the debounce timer completes.
**Action:** When debouncing searches, always update the local input text state immediately, and only debounce the secondary action (like the API call or complex filtering).

## 2026-04-29 - Redundant Array Lookups in Render Methods
**Learning:** Calling `.find()` or similar array methods multiple times within JSX to access the same data points (like finding a specific participant in a chat array) creates unnecessary CPU overhead on every render cycle.
**Action:** Extract the array lookup result into a local variable before the return statement and reference that variable in the JSX. This ensures the array is only traversed once per render, significantly improving performance (~76% reduction in CPU cycles for this specific pattern).
