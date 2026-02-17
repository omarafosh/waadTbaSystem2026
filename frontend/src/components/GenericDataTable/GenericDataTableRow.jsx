import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

/**
 * GenericDataTableRow - Memoized Table Row Component
 *
 * Optimized to prevent unnecessary re-renders when parent GenericDataTable updates
 * but the row data itself hasn't changed.
 */
const GenericDataTableRow = memo(
  ({ row, onRowClick, isRowClickable, cellPadding }) => {
    return (
      <TableRow
        hover
        onClick={() => isRowClickable && onRowClick(row)}
        sx={{
          cursor: isRowClickable ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: isRowClickable ? 'action.hover' : 'inherit'
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
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    // We only re-render if:
    // 1. The underlying data changes (reference check)
    // 2. The row selection state changes
    // 3. The cell padding prop changes
    // 4. The click handler function reference changes (should be stable via useCallback)
    // 5. The clickability status changes

    // Note: We don't deep compare columns because getVisibleCells() handles column visibility
    // If columns change structurally, the table instance usually recreates rows anyway.

    return (
      prevProps.row.original === nextProps.row.original &&
      prevProps.row.getIsSelected() === nextProps.row.getIsSelected() &&
      prevProps.cellPadding === nextProps.cellPadding &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.isRowClickable === nextProps.isRowClickable
    );
  }
);

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func.isRequired,
  isRowClickable: PropTypes.bool.isRequired,
  cellPadding: PropTypes.oneOf(['normal', 'dense'])
};

export default GenericDataTableRow;
