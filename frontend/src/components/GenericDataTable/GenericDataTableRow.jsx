import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

const GenericDataTableRow = memo(
  ({
    row,
    onRowClick,
    cellPadding,
    visibleColumnIds // primitive string to track column visibility changes
  }) => {
    const handleRowClickInternal = () => {
      if (onRowClick) {
        onRowClick(row.original);
      }
    };

    return (
      <TableRow
        hover
        onClick={onRowClick ? handleRowClickInternal : undefined}
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
    // Custom comparator for TanStack Table rows since row objects are recreated every render
    return (
      prevProps.row.original === nextProps.row.original &&
      prevProps.row.index === nextProps.row.index &&
      prevProps.visibleColumnIds === nextProps.visibleColumnIds &&
      prevProps.cellPadding === nextProps.cellPadding &&
      prevProps.onRowClick === nextProps.onRowClick
    );
  }
);

GenericDataTableRow.displayName = 'GenericDataTableRow';

GenericDataTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func,
  cellPadding: PropTypes.string,
  visibleColumnIds: PropTypes.string.isRequired
};

export default GenericDataTableRow;
