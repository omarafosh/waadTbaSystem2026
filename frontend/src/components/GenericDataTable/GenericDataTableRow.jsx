import PropTypes from 'prop-types';
import { memo } from 'react';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

const GenericDataTableRow = memo(
  ({ row, onRowClick, cellPadding }) => {
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
  },
  (prev, next) => {
    return (
      prev.row.original === next.row.original &&
      prev.row.index === next.row.index &&
      prev.row.getIsSelected() === next.row.getIsSelected() &&
      prev.onRowClick === next.onRowClick &&
      prev.cellPadding === next.cellPadding &&
      prev.columns === next.columns
    );
  }
);

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.string,
  columns: PropTypes.array
};

export default GenericDataTableRow;
