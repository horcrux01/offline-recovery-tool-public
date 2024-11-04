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

type ExcheqrTextFieldV2Props = TextFieldProps & {
  setInputValue?: (val: string) => void;
  sx?: any;
  disallowDecimals?: boolean;
  isJsonField?: boolean;
  rowsCount?: number;
  err?: boolean;
};

const ExcheqrTextFieldV2: React.FC<ExcheqrTextFieldV2Props> = (props) => {
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
        '.MuiInputBase-root': {
          padding: '5.612px 12px',
          borderRadius: '6px',
          backgroundColor: '#FFFFFF',
          border: err
            ? '1px solid #d32f2f !important'
            : '1px solid #E6E7E9 !important',
          ':hover': {
            borderColor: err ? '#d32f2f !important' : '#3377FF !important',
          },
        },
        input: {
          padding: '0',
          // Hide the spinner (arrow) for number input
          '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
          },
          '&[type=number]': {
            '-moz-appearance': 'textfield',
          },
        },
        ':hover': {
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: '#3377FF !important',
            borderWidth: '1px',
          },
        },
        '.MuiFormHelperText-root': {
          fontFamily: 'Poppins',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: '16px',
          color: err ? '#d32f2f' : '#BFBFBF',
          margin: '5px 0 0 0 !important',
        },
        fieldset: {
          border: 'none',
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

export default React.memo(ExcheqrTextFieldV2);
