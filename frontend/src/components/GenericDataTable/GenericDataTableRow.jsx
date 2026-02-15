import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

/**
 * GenericDataTableRow - Memoized Row Component
 *
 * Performance optimization:
 * This component is memoized to prevent unnecessary re-renders of all rows
 * when the parent table component re-renders (e.g., during pagination, filtering changes that don't affect this row).
 *
 * It uses a custom comparison function to check if the underlying data or relevant props have actually changed.
 */
const GenericDataTableRow = memo(({ row, onRowClick, cellPadding, columns }) => {
  return (
    <TableRow
      hover
      onClick={() => onRowClick && onRowClick(row)}
      sx={{
        cursor: onRowClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: onRowClick ? 'action.hover' : 'inherit'
        }
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          align={cell.column.columnDef.align || 'center'}
          sx={{
            py: cellPadding === 'dense' ? 1 : 2,
            verticalAlign: 'middle'
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when parent re-renders but row data is same.
  // We check:
  // 1. Data reference equality (row.original)
  // 2. Selection state (row.getIsSelected())
  // 3. Click handler stability (onRowClick)
  // 4. Column definition stability (columns) - strictly, if columns change, we must re-render.
  // 5. Padding prop

  return (
    prevProps.row.original === nextProps.row.original &&
    prevProps.row.getIsSelected() === nextProps.row.getIsSelected() &&
    prevProps.onRowClick === nextProps.onRowClick &&
    prevProps.cellPadding === nextProps.cellPadding &&
    prevProps.columns === nextProps.columns
  );
});

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.string,
  columns: PropTypes.array // Passed for memoization check
};

export default GenericDataTableRow;
