'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    primary: {
      light: '#f6d7a8',
      main: '#F4CE93',
      dark: '#aa9066',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ef8022',
      main: '#EB6101',
      dark: '#a44300',
      contrastText: '#000',
    },
  }
});

export default theme;
