import { memo } from 'react';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';
import { TableRow, TableCell } from '@mui/material';

/**
 * GenericTableRow - Memoized row component for GenericDataTable
 *
 * Separated to prevent unnecessary re-renders of all rows when table state changes
 * (like pagination, filtering) but the visible rows remain the same, or when
 * parent components re-render.
 */
const GenericTableRow = memo(({ row, cellPadding = 'normal', onRowClick }) => {
  const handleClick = () => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  return (
    <TableRow
      hover
      onClick={handleClick}
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
});

GenericTableRow.displayName = 'GenericTableRow';

GenericTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  cellPadding: PropTypes.oneOf(['normal', 'dense']),
  onRowClick: PropTypes.func
};

export default GenericTableRow;
