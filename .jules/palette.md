## 2024-04-21 - [Icon-Only Button Accessibility in React Native]
**Learning:** Icon-only buttons in React Native (`TouchableOpacity` wrapping an icon) require explicit `accessibilityRole="button"` and `accessibilityLabel` props. Without these, screen readers announce them generically or just announce the internal icon name (if present), leading to poor UX for visually impaired users.
**Action:** Always forward accessibility props (especially `accessibilityRole` and `accessibilityLabel`) to the interactive wrapper of any reusable icon button component.
