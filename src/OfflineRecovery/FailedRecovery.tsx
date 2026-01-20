import { Box, Button } from '@mui/material';
import React, { FC, memo } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import ExcheqrTypography from 'shared-resources/ExcheqrTypography';

type FailedRecoveryProps = {
  setStep: (step: number) => void;
  recreateError: string;
};

const FailedRecovery: FC<FailedRecoveryProps> = ({
  setStep,
  recreateError,
}) => (
  <Box sx={{ width: '90vw', marginY: '66px ' }}>
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
        padding: '32px',
        bgcolor: '#F7F9FF',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        gap: '10px',
      }}
    >
      <Box sx={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <ErrorIcon
          sx={{
            height: '90px',
            width: '90px',
            color: '#F44336',
            //   bgcolor: '#0EA453',
            borderRadius: '999px',
            //   padding: '17px',
          }}
        />
        <Box>
          <ExcheqrTypography variant='h2'>
            Something went wrong
          </ExcheqrTypography>
          <ExcheqrTypography variant='body1' color='#6A707D'>
            {recreateError || 'We could not process your recovery'}
          </ExcheqrTypography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: '20px' }}>
        {/* <Button variant='outlined'>Get in touch</Button> */}
        <Button
          variant='contained'
          onClick={() => {
            setStep(1);
          }}
          sx={{
            whiteSpace: 'nowrap',
            textTransform: 'none',
          }}
        >
          <ExcheqrTypography variant='button1' sx={{ color: '#FFFFFF' }}>
            Try Again
          </ExcheqrTypography>
        </Button>
      </Box>
    </Box>
  </Box>
);
export default memo(FailedRecovery);
