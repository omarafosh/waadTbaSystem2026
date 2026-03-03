## 2024-03-03 - TanStack Table v8 Re-render Bottleneck
**Learning:** TanStack Table v8 recreates the \`row\` object on every render. Relying on reference equality for memoizing row components fails, causing full table re-renders when parent state changes (e.g., global \`actionLoading\` state).
**Action:** When memoizing row components mapped from TanStack Table, always use a custom \`React.memo\` comparator that checks \`prevProps.row.original === nextProps.row.original\` and \`prevProps.row.index === nextProps.row.index\` along with any other primitive props.
