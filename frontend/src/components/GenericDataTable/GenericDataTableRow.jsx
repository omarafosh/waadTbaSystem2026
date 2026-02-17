import { memo } from 'react';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';
import { TableRow, TableCell } from '@mui/material';

const GenericDataTableRow = memo(
  ({
    row,
    onClick,
    cellPadding,
    columns // Used for invalidation in comparator
  }) => {
    return (
      <TableRow
        hover
        onClick={() => onClick && onClick(row)}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: onClick ? 'action.hover' : 'inherit'
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
      prevProps.row.getIsSelected() === nextProps.row.getIsSelected() &&
      prevProps.row.index === nextProps.row.index &&
      prevProps.columns === nextProps.columns &&
      prevProps.cellPadding === nextProps.cellPadding &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  cellPadding: PropTypes.oneOf(['normal', 'dense']),
  columns: PropTypes.array
};

GenericDataTableRow.displayName = 'GenericDataTableRow';

export default GenericDataTableRow;
