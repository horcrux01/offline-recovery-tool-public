import { Typography } from '@mui/material';
import React, { FC, memo } from 'react';

type ExcheqrTypographyProps = {
  variant?: string;
  children:
    | string
    | React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    | string[];
  color?: string;
  sx?: {};
  align?: 'right' | 'left' | 'inherit' | 'center' | 'justify' | undefined;
  display?: string;
};
export const getTypographyStyles = (variant: string, sx?: {}) => {
  let fontSize: string = '';
  let fontWeight: string = '';
  let lineHeight: string = '';
  switch (variant) {
    case 'h1': {
      fontSize = '40px !important';
      lineHeight = '48px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h2': {
      fontSize = '32px !important';
      lineHeight = '40px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h3': {
      fontSize = '24px !important';
      lineHeight = '32px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h4': {
      fontSize = '20px !important';
      lineHeight = '28px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h4.5': {
      fontSize = '18px !important';
      lineHeight = '28px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h5': {
      fontSize = '16px !important';
      lineHeight = '22px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h5.5': {
      fontSize = '14px !important';
      lineHeight = '22px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h6': {
      fontSize = '12px !important';
      lineHeight = '16px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'h7': {
      fontSize = '10px !important';
      lineHeight = '14px !important';
      fontWeight = '600 !important';
      break;
    }
    case 'subtitle1': {
      fontSize = '14px !important';
      lineHeight = '20px !important';
      fontWeight = '500 !important';
      break;
    }
    case 'subtitle2': {
      fontSize = '12px !important';
      lineHeight = '16px !important';
      fontWeight = '500 !important';
      break;
    }
    case 'subtitle3': {
      fontSize = '16px !important';
      lineHeight = '22px !important';
      fontWeight = '500 !important';
      break;
    }
    case 'subtitle4': {
      fontSize = '10px !important';
      lineHeight = '22px !important';
      fontWeight = '500 !important';
      break;
    }
    case 'body1': {
      fontSize = '16px !important';
      lineHeight = '22px !important';
      fontWeight = '400 !important';
      break;
    }
    case 'body2': {
      fontSize = '14px !important';
      lineHeight = '20px !important';
      fontWeight = '400 !important';
      break;
    }
    case 'button1': {
      fontSize = '16px !important';
      fontWeight = '500 !important';
      break;
    }
    case 'button2': {
      fontSize = '14px !important';
      fontWeight = '500 !important';
      break;
    }
    case 'caption': {
      fontSize = '12px !important';
      lineHeight = '16px !important';
      fontWeight = '400 !important';
      break;
    }
    default: {
      // eslint-disable-next-line
      sx;
      break;
    }
  }
  return { fontSize, fontWeight, lineHeight };
};

const ExcheqrTypography: FC<ExcheqrTypographyProps> = ({
  variant,
  children,
  color = 'black',
  sx,
  align,
  display,
}) => {
  const { fontSize, fontWeight, lineHeight } = getTypographyStyles(
    variant || '',
    sx
  );
  return (
    <Typography
      className='text-red-200'
      color={color}
      align={align}
      variant='inherit'
      sx={{
        fontFamily: "'Poppins', sans-serif",
        fontSize,
        fontWeight,
        lineHeight,
        ...sx,
      }}
      display={display}
    >
      {children}
    </Typography>
  );
};

export default memo(ExcheqrTypography);
