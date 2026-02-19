import { memo } from 'react';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';
import { TableRow, TableCell } from '@mui/material';

const GenericDataTableRow = memo(
  ({ row, onRowClick, cellPadding }) => {
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
    // We only re-render if data or configuration changed
    return (
      prev.row.original === next.row.original && // Data unchanged
      prev.row.index === next.row.index && // Index unchanged
      prev.columns === next.columns && // Column config unchanged
      prev.cellPadding === next.cellPadding && // Style prop unchanged
      prev.onRowClick === next.onRowClick // Handler unchanged
    );
  }
);

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.oneOf(['normal', 'dense']),
  columns: PropTypes.array // Used for memoization comparison only
};

export default GenericDataTableRow;
