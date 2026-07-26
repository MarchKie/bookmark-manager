import { createTheme, responsiveFontSizes } from '@mui/material/styles';

export const getAppTheme = (mode: 'dark' | 'light') => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#6366F1', // Vibrant Indigo
        light: '#818CF8',
        dark: '#4F46E5',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#EC4899', // Pink Accent
        light: '#F472B6',
        dark: '#DB2777',
      },
      background: {
        default: mode === 'dark' ? '#0F172A' : '#F8FAFC',
        paper: mode === 'dark' ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: mode === 'dark' ? '#F8FAFC' : '#0F172A',
        secondary: mode === 'dark' ? '#94A3B8' : '#64748B',
      },
    },
    typography: {
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
      h1: { fontFamily: 'Outfit, sans-serif', fontWeight: 800 },
      h2: { fontFamily: 'Outfit, sans-serif', fontWeight: 700 },
      h3: { fontFamily: 'Outfit, sans-serif', fontWeight: 700 },
      h4: { fontFamily: 'Outfit, sans-serif', fontWeight: 700 },
      h5: { fontFamily: 'Outfit, sans-serif', fontWeight: 600 },
      h6: { fontFamily: 'Outfit, sans-serif', fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 18px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            },
          },
          contained: {
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            boxShadow:
              mode === 'dark'
                ? '0 4px 20px 0 rgba(0, 0, 0, 0.35)'
                : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow:
                mode === 'dark'
                  ? '0 8px 30px 0 rgba(0, 0, 0, 0.5)'
                  : '0 8px 30px 0 rgba(99, 102, 241, 0.12)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            boxShadow: 'none',
            color: mode === 'dark' ? '#F8FAFC' : '#0F172A',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme);
};
