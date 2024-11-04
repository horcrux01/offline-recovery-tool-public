import React, { FC, memo, useState } from 'react';
import SecurityIcon from '@mui/icons-material/Security';
import { Box, Button, CircularProgress } from '@mui/material';
import ExcheqrTypography from 'shared-resources/ExcheqrTypography';
import KeyShareUploadComponent from './KeyShareUploadComponent';
import { reCreateKeys, validateFile } from '../KeyComputation/ReCreateKey';
import FailedRecovery from './FailedRecovery';
import SuccessFullRecoveryComponent from './SuccessFullRecoveryComponent';

type OfflineRecoveryComponentProps = {};

const OfflineRecoveryComponent: FC<OfflineRecoveryComponentProps> = () => {
  const [step, setStep] = useState(1);
  const [fileContents, setFileContents] = useState<any>({});
  const [passwords, setPasswords] = useState<any>({});
  const [finalPvtKeys, setFinalPvtKeys] = useState<string[][]>([]);
  const [validatePasswordErrors, setValidatePasswordErrors] = useState<any>({});
  const [validateFileErrors, setValidateFileErrors] = useState<any>({});
  const [recreateError, setRecreteError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{
    [key: string]: File;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    let hasError = false;
    setIsLoading(true);
    // eslint-disable-next-line
    for (const key in fileContents) {
      // eslint-disable-next-line
      const isValid = await validateFile(
        fileContents[key],
        passwords[key],
        setValidatePasswordErrors,
        setValidateFileErrors,
        key
      );
      if (!isValid) {
        hasError = true;
        setIsLoading(false);
      }
    }
    if (!hasError) {
      try {
        const fullPvtKeys = await reCreateKeys(
          Object.values(fileContents),
          Object.values(passwords),
          setRecreteError
        );
        setIsLoading(false);
        setFinalPvtKeys(fullPvtKeys);
        setStep(3);
      } catch (e: any) {
        setIsLoading(false);
        setRecreteError(e.message);
        setStep(2);
      }
    }
  };

  return (
    <Box>
      {step === 1 && (
        <Box sx={{ marginTop: '30px', marginBottom: '50px' }}>
          <Box
            sx={{ objectFit: 'contain' }}
            height='38px'
            width='192px'
            paddingBottom='7px'
            marginBottom='7px'
            marginX='24px'
            component='img'
            src='https://excheqr-public.s3.us-west-1.amazonaws.com/primevault-logo-auth0.png'
            alt='Logo'
          />
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '32px',
                bgcolor: '#F7F9FF',
                marginBottom: '20px',
              }}
            >
              <SecurityIcon
                sx={{ width: '100px', height: '100px', color: '#3377FF' }}
              />
              <Box>
                <ExcheqrTypography variant='h2'>
                  Offline Recovery Tool
                </ExcheqrTypography>
                <ExcheqrTypography
                  variant='body1'
                  sx={{ marginTop: '10px', color: '#6A707D' }}
                >
                  Upload encrypted key shares and enter recovery passphrase for
                  2 out of 3 assigned organization users
                </ExcheqrTypography>
              </Box>
            </Box>
            <Box
              sx={{
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {Array.from({ length: 3 }, (_, index) => (
                <KeyShareUploadComponent
                  setSelectedFiles={setSelectedFiles}
                  selectedFiles={selectedFiles}
                  validatePasswordErrors={validatePasswordErrors}
                  setValidatePasswordErrors={setValidatePasswordErrors}
                  validateFileErrors={validateFileErrors}
                  setValidateFileErrors={setValidateFileErrors}
                  key={index}
                  keyIndex={index.toString()}
                  setFileContents={setFileContents}
                  setPasswords={setPasswords}
                  passwords={passwords}
                />
              ))}
            </Box>
            <Button
              variant='contained'
              sx={{
                width: '100%',
                textTransform: 'none',
              }}
              onClick={async () => {
                await onSubmit();
              }}
              disabled={
                Object.values(validateFileErrors).length > 0 ||
                Object.values(validatePasswordErrors).length > 0 ||
                Object.values(passwords).length < 2 ||
                Object.values(fileContents).length < 2
              }
            >
              <ExcheqrTypography variant='button1' sx={{ color: '#FFFFFF' }}>
                {isLoading ? (
                  <CircularProgress size={20} color='inherit' />
                ) : (
                  'Recover Vaults'
                )}
              </ExcheqrTypography>
            </Button>
          </Box>
        </Box>
      )}
      {step === 2 && (
        <FailedRecovery setStep={setStep} recreateError={recreateError} />
      )}
      {step === 3 && (
        <SuccessFullRecoveryComponent
          setStep={setStep}
          finalPvtKeys={finalPvtKeys}
        />
      )}
    </Box>
  );
};
export default memo(OfflineRecoveryComponent);
