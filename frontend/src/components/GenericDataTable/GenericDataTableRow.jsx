import { memo } from 'react';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';
import { TableRow, TableCell } from '@mui/material';

/**
 * GenericDataTableRow - Memoized row component for GenericDataTable
 *
 * Performance Note:
 * This component uses a custom comparator to prevent re-renders when the parent
 * GenericDataTable re-renders but the row data and configuration are stable.
 * TanStack Table v8 recreates row objects on every render, so default memoization fails.
 */
const GenericDataTableRow = memo(
  ({ row, onRowClick, cellPadding, columns }) => {
    return (
      <TableRow
        hover
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
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
  },
  (prev, next) => {
    // Custom comparator logic:
    // 1. Check data stability (row.original)
    // 2. Check configuration stability (columns, cellPadding, onRowClick)
    // 3. Check index stability (row.index)

    return (
      prev.row.original === next.row.original &&
      prev.row.index === next.row.index &&
      prev.columns === next.columns &&
      prev.cellPadding === next.cellPadding &&
      prev.onRowClick === next.onRowClick
    );
  }
);

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.oneOf(['normal', 'dense']),
  columns: PropTypes.array // Used for stability check in comparator
};

export default GenericDataTableRow;
