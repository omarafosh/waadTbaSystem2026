## 2025-03-04 - Memoizing TanStack Table v8 Rows
**Learning:** TanStack Table v8 recreates row objects on every render.
**Action:** To prevent full N-row table re-renders during single-row actions (like hover tooltips or row selection), memoize row components using a custom React.memo comparator. Check `row.original` and `row.index` rather than relying on default shallow comparison of the `row` object.
