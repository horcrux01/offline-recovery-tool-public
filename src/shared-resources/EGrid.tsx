/* eslint-disable arrow-body-style */
import {
  DataGrid,
  GridCsvExportOptions,
  GridToolbarContainer,
  useGridApiContext,
} from '@mui/x-data-grid';
import { makeStyles } from '@material-ui/styles';
import React, { FC } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, Button } from '@mui/material';

// Custom toolbar component with a custom button for CSV export
const CustomToolbar = () => {
  const apiRef = useGridApiContext(); // Get access to the DataGrid's API

  const handleCustomButtonClick = () => {
    // Custom button click handler to export CSV
    const options: GridCsvExportOptions = { fileName: 'pv_wallet_keys' };
    apiRef.current.exportDataAsCsv(options);
  };

  return (
    <GridToolbarContainer>
      <Button
        variant='contained'
        sx={{
          textTransform: 'none',
          position: 'absolute',
          top: 9,
          right: 0,
          zIndex: 1,
        }}
        onClick={handleCustomButtonClick}
      >
        Download CSV
      </Button>
    </GridToolbarContainer>
  );
};

interface Props {
  rows: any[];
  columns: any[];
  loading?: boolean;
  margin?: {
    right: string;
    left: string;
  };
  onRowClick?: (v: any) => void;
  rowHeight?: number;
  getRowId?: (row: any) => any;
  initialState?: any;
  exportCsv?: boolean;
}

const useStyles = makeStyles({
  columnHeader: {
    backgroundColor: '#F7F9FF',
    color: '#667085',
    width: '100%',
    height: '44px',
  },
});

const CustomIconDescending: FC = () => (
  <ArrowDropDownIcon sx={{ color: 'black' }} />
);

const CustomIconAscending: FC = () => (
  <ArrowDropUpIcon sx={{ color: 'black' }} />
);

const EGrid: React.FC<Props> = ({
  rows,
  columns,
  loading,
  margin,
  onRowClick,
  rowHeight,
  getRowId,
  initialState,
  exportCsv,
}) => {
  const classes = useStyles();

  let left = '48px';
  let right = '48px';

  if (margin) {
    left = margin.left;
    right = margin.right;
  }
  return (
    <Box sx={{ height: '90%', width: '100%' }}>
      <DataGrid
        headerHeight={46}
        rowHeight={rowHeight || 46}
        classes={{
          columnHeader: classes.columnHeader,
        }}
        onRowClick={onRowClick}
        rows={rows}
        columns={columns}
        disableColumnMenu
        pagination
        disableSelectionOnClick
        loading={loading}
        getRowId={getRowId}
        components={{
          ColumnSortedDescendingIcon: CustomIconDescending,
          ColumnSortedAscendingIcon: CustomIconAscending,
          Toolbar: exportCsv ? CustomToolbar : undefined,
        }}
        getRowClassName={() => (onRowClick ? 'cursor-pointer' : '')}
        sx={{
          root: {
            border: 'none',
          },
          '.MuiDataGrid-columnSeparator': {
            display: 'none',
          },
          '.MuiDataGrid-columnHeader': {
            borderRight: 'none',
            borderBottom: 'none',
          },
          '.MuiDataGrid-columnHeaderTitle': {
            fontWeight: '600',
            color: '#384052',
            fontSize: '14px',
            lineHeight: '20px',
            fontFamily: '"Poppins", sans-serif',
            whiteSpace: 'normal !important',
            wordWrap: 'break-word !important',
          },
          '.MuiDataGrid-columnHeaders': {
            borderBottom: 'none',
          },
          '.MuiDataGrid-cellContent': {
            fontFamily: '"Poppins", sans-serif',
          },
          '.MuiDataGrid-row:hover': {
            backgroundColor: '#F7F9FF',
          },
          '.MuiDataGrid-row': {
            borderTop: '1px solid #F7F9FF',
            borderBottom: 'none !important',
            height: 'auto !important',
            minHeight: `${rowHeight || 46}px`,
          },
          '.MuiDataGrid-row:not(.MuiDataGrid-row--dynamicHeight)>.MuiDataGrid-cell':
            {
              whiteSpace: 'normal !important',
              wordWrap: 'break-word !important',
            },
          '.MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '.MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
          '.MuiDataGrid-footerContainer': {
            borderTop: '1px solid #F7F9FF',
            height: '46px',
            minHeight: '46px',
          },
          '.MuiTablePagination-root': {
            padding: 'none',
            margin: 'none',
          },
          '.MuiTablePagination-toolbar': {
            minHeight: '46px',
          },
          '.MuiDataGrid-cell:focus-within': {
            outline: 'none !important',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
            display: 'none',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
            display: 'none',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
            display: 'none',
          },
          '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
            display: 'none',
          },
          borderRadius: '8px',
          borderTop: '1px solid #F7F9FF',
          borderColor: '#F7F9FF',
          marginRight: { right },
          marginLeft: { left },
        }}
        initialState={initialState}
      />
    </Box>
  );
};

export default React.memo(EGrid);
