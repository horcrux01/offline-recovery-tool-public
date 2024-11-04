import React, { FC, memo, useMemo } from 'react';
import { Box, Button, IconButton, InputAdornment } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import ExcheqrTypography from 'shared-resources/ExcheqrTypography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExcheqrTextFieldV2 from 'shared-resources/ExcheqrTextFieldV2';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { bigIntToHex } from '../KeyComputation/utils';
import EGrid from '../shared-resources/EGrid';

type SuccessFulRecoveryComponentProps = {
  setStep: (step: number) => void;
  finalPvtKeys: string[][];
};

const SuccessFullRecoveryComponent: FC<SuccessFulRecoveryComponentProps> = ({
  setStep,
  finalPvtKeys,
}) => {
  const [searchValue, setSearchValue] = React.useState('');
  const data = finalPvtKeys.map((pvtKey, index) => ({
    id: index,
    vault: pvtKey[0],
    chain: pvtKey[1],
    address: pvtKey[2],
    publicKeyHex: pvtKey[3],
    privateKey: bigIntToHex(pvtKey[4]),
  }));
  const filterRows = (rowsdata: any, searchVal: string) => {
    if (!searchVal) {
      return rowsdata;
    }
    return rowsdata?.filter((el: any) =>
      searchVal
        ? Object.values(el).some(
            (value) =>
              typeof value === 'string' &&
              value.toLowerCase().includes(searchVal.toLowerCase())
          )
        : true
    );
  };

  const filteredRows = useMemo(
    () => filterRows(data, searchValue),
    [data, searchValue]
  );

  return (
    <Box sx={{ width: '90vw', marginY: '30px ' }}>
      <Box
        sx={{ objectFit: 'contain', marginBottom: '35px' }}
        height='38px'
        width='192px'
        paddingBottom='7px'
        marginX='24px'
        component='img'
        src='https://excheqr-public.s3.us-west-1.amazonaws.com/primevault-logo-auth0.png'
        alt='Logo'
      />
      <Box
        sx={{
          width: '100%',
          padding: '32px',
          bgcolor: '#F7F9FF',
          borderRadius: '8px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          marginBottom: '32px',
        }}
        onClick={() => {
          setStep(1);
        }}
      >
        <DoneIcon
          sx={{
            height: '20px',
            width: '20px',
            color: 'white',
            bgcolor: '#0EA453',
            borderRadius: '999px',
            padding: '17px',
          }}
        />
        <Box>
          <ExcheqrTypography variant='h2'>
            Recovery Successful!
          </ExcheqrTypography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <ExcheqrTypography
          sx={{
            fontSize: '20px',
            fontWeight: '600',
            lineHeight: '28px',
            marginBottom: '32px',
          }}
        >
          {`${data.length} Wallets Recovered`}
        </ExcheqrTypography>
        <ExcheqrTextFieldV2
          sx={{
            width: '30%',
          }}
          type='text'
          placeholder='Search by Vault'
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position='end'>
                <IconButton onClick={() => setSearchValue('')}>
                  <CloseIcon
                    sx={{
                      color: '#6A707D',
                    }}
                  />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              '& .MuiInputBase-input::placeholder': {
                opacity: 0.8,
              },
            },
          }}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </Box>
      <Box sx={{ height: '630px', overflow: 'auto' }}>
        <EGrid
          margin={{ right: '0px', left: '0px' }}
          rows={filteredRows || []}
          exportCsv
          columns={[
            {
              field: 'vault',
              headerName: 'Vault',
              width: 210,
            },
            {
              field: 'chain',
              headerName: 'Chain',
              width: 160,
            },
            {
              field: 'address',
              headerName: 'Address',
              width: 550,
            },
            {
              field: 'privateKey',
              headerName: 'Private Key Hex',
              width: 750,
              renderCell: (data: any) => (
                <Box
                  sx={{
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center',
                  }}
                >
                  <ExcheqrTypography variant='body2'>
                    {data.formattedValue}
                  </ExcheqrTypography>
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(data.formattedValue);
                    }}
                  >
                    <ContentCopyIcon sx={{ width: '13px', height: '13px' }} />
                  </IconButton>
                </Box>
              ),
            },
            {
              field: 'publicKeyHex',
              headerName: 'Public Key Hex',
              width: 750,
              renderCell: (data: any) => (
                <Box
                  sx={{
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center',
                  }}
                >
                  <ExcheqrTypography variant='body2'>
                    {data.formattedValue}
                  </ExcheqrTypography>
                  {data.formattedValue && (
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(data.formattedValue);
                      }}
                    >
                      <ContentCopyIcon sx={{ width: '13px', height: '13px' }} />
                    </IconButton>
                  )}
                </Box>
              ),
            },
          ]}
        />
      </Box>
      <Box
        sx={{
          width: '90%',
          position: 'fixed',
          height: '80px',
          bgcolor: 'white',
          display: 'flex',
          alignItems: 'center',
          bottom: 0,
        }}
      >
        <Button
          variant='contained'
          sx={{
            width: '50%',
            margin: 'auto',
            display: 'block',
            textTransform: 'none',
          }}
          onClick={() => {
            setStep(1);
          }}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default memo(SuccessFullRecoveryComponent);
