import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  input: {
    '& input[type=number]': {
      '-moz-appearance': 'textfield',
    },
    '& input[type=number]::-webkit-outer-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
    '& input[type=number]::-webkit-inner-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  },
});

type ExcheqrTextFieldProps = TextFieldProps & {
  setInputValue?: (val: string) => void;
  sx?: any;
  disallowDecimals?: boolean;
  isJsonField?: boolean;
  rowsCount?: number;
  err?: boolean;
};

const ExcheqrTextField: React.FC<ExcheqrTextFieldProps> = (props) => {
  const classes = useStyles();
  const {
    setInputValue,
    sx,
    type,
    disallowDecimals,
    isJsonField,
    rowsCount,
    err,
    ...otherProps
  } = props;
  const [inputValue, setValue] = useState('');

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // If type is 'number' and the pressed key is '.', prevent the key press
    if (type === 'number' && disallowDecimals && event.key === '.') {
      event.preventDefault();
    }
  };

  const detectAndParseJSON = (value: string) => {
    try {
      // Attempt to parse as JSON
      return JSON.parse(value);
    } catch (error) {
      // If parsing fails, return the original value
      return value;
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = event.target.value;
    if (type === 'number') {
      // Remove leading zeroes
      newValue = newValue.replace(/^0+/, '');
      // If the value is empty after removing leading zeroes, set it to '0'
      if (!newValue) {
        newValue = '0';
      }
    }
    setValue(newValue);
    if (setInputValue) {
      setInputValue(isJsonField ? detectAndParseJSON(newValue) : newValue);
    }
  };

  return (
    <TextField
      fullWidth
      // className={classes.textInput}
      onKeyPress={handleKeyPress}
      sx={{
        '& .MuiInputLabel-root': {
          fontFamily: "'Poppins', sans-serif",
          color: 'text.secondary',
          fontWeight: '400',
          fontSize: '14px',
          lineHeight: '20px',
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#3377FF',
        },
        '& .MuiInputLabel-outlined': {
          transform: 'translate(0px, 1.5px) scale(1)',
        },
        '& .MuiInputLabel-outlined.MuiInputLabel-shrink': {
          transform: 'translate(0px, -20px) scale(0.75)',
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: 'transparent',
          },
          '&:hover fieldset': {
            borderColor: 'transparent',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'transparent',
          },
          padding: isJsonField ? '16.5px 0' : undefined,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderRight: 'transparent',
          borderLeft: 'transparent',
          borderTop: 'transparent',
          borderRadius: 0,
        },
        '& .Mui-error .MuiOutlinedInput-notchedOutline': {
          borderRight: 'transparent',
          borderLeft: 'transparent',
          borderTop: 'transparent',
          borderRadius: 0,
        },
        '& .MuiOutlinedInput-input': {
          borderBottom: '1px solid',
          borderRadius: 0,
          padding: '4px 0',
          borderColor: () => (err ? '#FF0000' : '#BFBFBF'),
          '&:before': {
            borderBottomColor: '#BFBFBF',
            borderColor: '#3377FF',
          },
          '&:hover': {
            borderBottomColor: '#3377FF',
            borderColor: '#3377FF',
          },
          '&.Mui-focused': {
            borderBottomColor: '#3377FF',
            borderColor: '#3377FF',
          },
        },
        '& .MuiFormHelperText-root': {
          marginLeft: 0,
          fontFamily: "'Poppins', sans-serif",
        },
        '& .Mui-error': {
          marginLeft: 0,
        },
        '& .MuiInput-underline:before': {
          borderBottomColor: '#BFBFBF', // Change default color here
        },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
          borderBottomColor: '#3377FF', // Change hover color here
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: '#3377FF', // Change focused color here
        },
        '& .MuiInputBase-input': {
          fontFamily: "'Poppins', sans-serif",
        },
        ...sx,
      }}
      value={inputValue}
      onChange={handleChange}
      type={type}
      multiline={isJsonField}
      rows={isJsonField ? rowsCount : undefined}
      {...otherProps}
      className={classes.input}
    />
  );
};

export default React.memo(ExcheqrTextField);
