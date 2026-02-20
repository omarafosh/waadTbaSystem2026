import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

const GenericDataTableRow = memo(
  ({ row, cellPadding, onRowClick, columns }) => {
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
    return (
      prevProps.row.original === nextProps.row.original &&
      prevProps.row.index === nextProps.row.index &&
      prevProps.cellPadding === nextProps.cellPadding &&
      prevProps.onRowClick === nextProps.onRowClick &&
      prevProps.columns === nextProps.columns
    );
  }
);

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  cellPadding: PropTypes.string,
  onRowClick: PropTypes.func,
  columns: PropTypes.array
};

export default GenericDataTableRow;
