import { memo } from 'react';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';
import { TableRow, TableCell } from '@mui/material';

const GenericDataTableRow = memo(
  ({ row, onRowClick, cellPadding, columns }) => {
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
  },
  (prevProps, nextProps) => {
    // Custom comparator
    return (
      prevProps.row.original === nextProps.row.original &&
      prevProps.row.index === nextProps.row.index &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.cellPadding === nextProps.cellPadding &&
      prevProps.columns === nextProps.columns // Check memoized columns from parent
    );
  }
);

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.oneOf(['normal', 'dense']),
  columns: PropTypes.array
};

GenericDataTableRow.displayName = 'GenericDataTableRow';

export default GenericDataTableRow;
