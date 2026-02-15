import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

/**
 * GenericDataTableRow
 *
 * A memoized row component to prevent unnecessary re-renders in GenericDataTable.
 * It uses a custom comparator to ensure rows only re-render when:
 * 1. The underlying data (row.original) changes
 * 2. The column definitions change (which might affect renderers)
 * 3. Row selection state changes
 * 4. Interactions or styles (onRowClick, cellPadding) change
 *
 * This optimization is critical because TanStack Table recreates 'row' objects on every render,
 * causing default React.memo to fail.
 */
const GenericDataTableRow = ({ row, columns, onRowClick, cellPadding }) => {
  return (
    <TableRow
      hover
      onClick={() => onRowClick && onRowClick(row.original)}
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
};

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired, // Used for memoization check
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.oneOf(['normal', 'dense'])
};

const arePropsEqual = (prevProps, nextProps) => {
  // 1. Column Definitions: If columns change (e.g. action handlers, visibility), re-render.
  if (prevProps.columns !== nextProps.columns) return false;

  // 2. Event Handlers: If onRowClick changes, re-render.
  if (prevProps.onRowClick !== nextProps.onRowClick) return false;

  // 3. Styles: If padding changes, re-render.
  if (prevProps.cellPadding !== nextProps.cellPadding) return false;

  // 4. Data: Check if the underlying data reference has changed.
  // Note: TanStack Table recreates the 'row' wrapper every time, but 'row.original'
  // preserves the reference to the actual data item.
  if (prevProps.row.original !== nextProps.row.original) return false;

  // 5. State: Check if selection state changed.
  if (prevProps.row.getIsSelected() !== nextProps.row.getIsSelected()) return false;

  // 6. Index: Check if row index changed (e.g. sorting/filtering)
  if (prevProps.row.index !== nextProps.row.index) return false;

  return true;
};

export default memo(GenericDataTableRow, arePropsEqual);
