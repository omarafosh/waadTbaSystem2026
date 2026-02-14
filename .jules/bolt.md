## 2025-02-14 - Stabilizing Custom Hook Return Values
**Learning:** Custom hooks that return complex objects (like `useTableState`) can inadvertently cause unnecessary re-renders in consuming components if the returned object is not memoized, even if the internal state is stable. This negates `React.memo` optimizations in child components.
**Action:** Always wrap the return object of custom hooks in `useMemo` when it is expected to be used as a prop for memoized components.
