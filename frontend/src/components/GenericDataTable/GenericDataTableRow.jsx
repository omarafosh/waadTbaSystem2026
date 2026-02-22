import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

const GenericDataTableRow = ({ row, cellPadding, onRowClick, columns }) => {
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
};

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  cellPadding: PropTypes.string,
  onRowClick: PropTypes.func,
  columns: PropTypes.array
};

const arePropsEqual = (prev, next) => {
  return (
    prev.row.original === next.row.original &&
    prev.row.index === next.row.index &&
    prev.cellPadding === next.cellPadding &&
    prev.onRowClick === next.onRowClick &&
    prev.columns === next.columns
  );
};

export default memo(GenericDataTableRow, arePropsEqual);
