
2026-04-20 - Memoize Initials Calculation in Avatar / Redundant string manipulation (split/map/join/toUpperCase) was running on every render for the Avatar component. / Wrapped the initials calculation in `useMemo` with `name` as a dependency to ensure it only recalculates when the name changes.
