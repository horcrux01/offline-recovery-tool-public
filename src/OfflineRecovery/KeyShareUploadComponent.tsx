import React, { FC, memo, useRef, useState } from 'react';
import { Box, Button, IconButton, InputAdornment } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// import useEnhancedEffect from '@mui/material/utils/useEnhancedEffect';
import ErrorIcon from '@mui/icons-material/Error';
import ExcheqrTypography from '../shared-resources/ExcheqrTypography';
import { readZipFile } from '../KeyComputation/utils';
import ExcheqrTextField from '../shared-resources/ExcheqrTextField';

type KeyShareCompProps = {
  keyIndex: string;
  validatePasswordErrors: { [key: string]: string };
  setValidatePasswordErrors: (error: any) => void;
  validateFileErrors: { [key: string]: string };
  setValidateFileErrors: (error: any) => void;
  setSelectedFiles: (file: any) => void;
  selectedFiles: { [key: string]: File } | null;
  setFileContents: (string: any) => void;
  setPasswords: (password: any) => void;
  passwords: { [key: string]: string };
};

const KeyShareUploadComponent: FC<KeyShareCompProps> = ({
  keyIndex,
  validatePasswordErrors,
  setValidatePasswordErrors,
  validateFileErrors,
  setValidateFileErrors,
  setSelectedFiles,
  selectedFiles,
  setFileContents,
  setPasswords,
  passwords,
}) => {
  // eslint-disable-next-line
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFiles((prev: any) => ({ ...prev, [keyIndex]: file }));
    if (file) {
      try {
        const fileContent = await readZipFile(file);
        setFileContents((prev: any) => ({ ...prev, [keyIndex]: fileContent }));
      } catch (error: any) {
        setValidateFileErrors((prevErrors: any) => ({
          ...prevErrors,
          [keyIndex]: error.message,
        }));
      }
    }
  };

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  // useEnhancedEffect(() => {
  //   if (selectedFiles && selectedFiles[keyIndex] && !passwords[keyIndex]) {
  //     setErrors((prev: any) => ({
  //       ...prev,
  //       [keyIndex]: 'passwords[keyIndex] is require',
  //     }));
  //   } else {
  //     setErrors((prev: any) => {
  //       const newErrors = { ...prev };
  //       if (newErrors[keyIndex]) {
  //         delete newErrors[keyIndex];
  //       }
  //       return newErrors;
  //     });
  //   }
  // }, [passwords[keyIndex], selectedFiles]);

  return (
    <Box
      sx={{
        border:
          (validateFileErrors && validateFileErrors[keyIndex]) ||
          (validatePasswordErrors && validatePasswordErrors[keyIndex])
            ? '1px solid #F44336'
            : '1px solid #D6E4FF',
        borderRadius: '8px',
        padding: '32px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ExcheqrTypography variant='h4'>{`Keyshare #${keyIndex}`}</ExcheqrTypography>
        {!selectedFiles || !selectedFiles[keyIndex] ? (
          <Button
            variant='outlined'
            onClick={handleClick}
            sx={{ textTransform: 'none' }}
          >
            <FileUploadIcon sx={{ color: '#3377FF' }} />
            Upload Encrypted Key Share
          </Button>
        ) : (
          <Box
            sx={{
              padding: '6px 12px',
              display: 'flex',
              gap: '8px',
              bgcolor: '#EBF1FF',
              alignItems: 'center',
              borderRadius: '4px',
            }}
          >
            <ExcheqrTypography variant='button1' sx={{ color: '#3377FF' }}>
              {selectedFiles && selectedFiles[keyIndex].name}
            </ExcheqrTypography>
            <IconButton
              onClick={() => {
                setSelectedFiles((prev: any) => {
                  const { [keyIndex]: key, ...rest } = prev;
                  return rest;
                });
                setFileContents((prev: any) => {
                  const { [keyIndex]: key, ...rest } = prev;
                  return rest;
                });
                setValidateFileErrors((prev: any) => {
                  const { [keyIndex]: key, ...rest } = prev;
                  return rest;
                });
                // Reset the file input value
                if (hiddenFileInput.current) {
                  hiddenFileInput.current.value = ''; // This clears the file input
                }
              }}
            >
              <CloseIcon
                sx={{ color: '#3377FF', height: '18px', width: '18px' }}
              />
            </IconButton>
          </Box>
        )}
        <input
          type='file'
          ref={hiddenFileInput}
          onChange={handleFileChange}
          accept='.zip'
          style={{ display: 'none' }}
        />
      </Box>
      <ExcheqrTextField
        error={
          !!(
            (validateFileErrors && validateFileErrors[keyIndex]) ||
            (validatePasswordErrors && validatePasswordErrors[keyIndex])
          )
        }
        value={passwords[keyIndex]}
        variant='standard'
        placeholder='Passphrase'
        type={showPassword ? 'text' : 'password'}
        sx={{ marginTop: '43px' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge='end'
                size='small'
              >
                {showPassword ? (
                  <VisibilityOffIcon sx={{ color: '#6A707D' }} />
                ) : (
                  <VisibilityIcon sx={{ color: '#6A707D' }} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        onChange={(e) => {
          if (e.target.value === '') {
            setPasswords((prev: any) => {
              const { [keyIndex]: key, ...rest } = prev;
              return rest;
            });
          } else {
            setPasswords((prev: any) => ({
              ...prev,
              [keyIndex]: e.target.value,
            }));
          }
          setValidatePasswordErrors((prev: any) => {
            const { [keyIndex]: key, ...rest } = prev;
            return rest;
          });
        }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '30px',
        }}
      >
        {!!(validateFileErrors && validateFileErrors[keyIndex]) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <ErrorIcon sx={{ color: '#F44336' }} />

            <ExcheqrTypography variant='button1' color='#F44336'>
              {validateFileErrors[keyIndex]}
            </ExcheqrTypography>
          </Box>
        )}
        {!!(validatePasswordErrors && validatePasswordErrors[keyIndex]) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <ErrorIcon sx={{ color: '#F44336' }} />

            <ExcheqrTypography variant='button1' color='#F44336'>
              {validatePasswordErrors[keyIndex]}
            </ExcheqrTypography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default memo(KeyShareUploadComponent);
