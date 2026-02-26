import { memo } from 'react';
import PropTypes from 'prop-types';
import { TableRow, TableCell } from '@mui/material';
import { flexRender } from '@tanstack/react-table';

/**
 * GenericDataTableRow
 *
 * A memoized row component for GenericDataTable.
 * Optimized to prevent re-renders when other table state changes but row data remains the same.
 */
const GenericDataTableRow = ({
  row,
  cellPadding,
  onClick,
  hasRowClick,
  columns // Passed specifically for memoization comparison
}) => {
  return (
    <TableRow
      hover
      onClick={() => onClick(row)}
      sx={{
        cursor: hasRowClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: hasRowClick ? 'action.hover' : 'inherit'
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
  onClick: PropTypes.func.isRequired,
  hasRowClick: PropTypes.bool.isRequired,
  columns: PropTypes.array
};

const arePropsEqual = (prevProps, nextProps) => {
  // TanStack Table recreates the row object on every render.
  // We strictly compare the underlying data and other stable props to avoid re-renders.
  return (
    prevProps.row.original === nextProps.row.original &&
    prevProps.row.index === nextProps.row.index &&
    prevProps.cellPadding === nextProps.cellPadding &&
    prevProps.hasRowClick === nextProps.hasRowClick &&
    prevProps.columns === nextProps.columns
  );
};

export default memo(GenericDataTableRow, arePropsEqual);
