import type { } from '@mui/x-data-grid/themeAugmentation'
import { alpha, createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    app: {
      headerTone: {
        successBg: string
        successBorder: string
        failedBg: string
        failedBorder: string
        pendingBg: string
        pendingBorder: string
      }
    }
  }
  interface ThemeOptions {
    app?: Partial<Theme['app']>
  }
  interface Palette {
    failed: Palette['error'];
    pending: Palette['warning'];
  }
  interface PaletteOptions {
    failed?: PaletteOptions['error'];
    pending?: PaletteOptions['warning'];
  }

}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a4480',
    },
    background: {
      default: '#44b1ef',
      paper: '#fff',
    },
    success: {
      light: '#c5ee93',
      main: '#2e7d32',
    },
    failed: {
      light: '#f7bbb0',
      main: '#c62828',
    },
    pending: {
      light: '#ffe396',
      main: '#f57c00',
    }
  },

  app: {
    headerTone: {
      successBg: '#edf3ec',
      successBorder: '#2e7d32',
      failedBg: '#f8dfe2',
      failedBorder: '#c62828',
      pendingBg: '#faf3d1',
      pendingBorder: '#f57c00',
    },
  },

  typography: {
    /** Make h4/h5 bolder globally so header picks it up */
    h4: { fontWeight: 800, lineHeight: 1.1 },
    h5: { fontWeight: 800, lineHeight: 1.1 },
  },

  components: {
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          borderTop: 'none',
        }),
      },
      variants: [
        {
          props: { variant: 'fullWidth' },
          style: ({ theme: _theme }) => ({
            borderBottomWidth: 4,
          }),
        },
        {
          props: { variant: 'middle' },
          style: { borderBottomWidth: 6 },
        },
      ],
    },

    MuiTypography: {
      styleOverrides: {
        h5: ({ theme }) => ({
          color: theme.palette.primary.main,
        }),
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: ({ theme: _theme }) => ({
          width: '100%',
          minHeight: 0,
          borderBottom: 'none',
          position: 'relative',
          zIndex: 2,
          top: 1,
        }),
        indicator: { display: 'none' },
      },
    },

    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 0,
          height: 36,
          borderRadius: 0,
          padding: theme.spacing(3),
          paddingInline: theme.spacing(1.25),
          marginRight: theme.spacing(1),
          backgroundColor: '#efefef',
          border: 0,
          fontSize: 20,
          color: '#000',

          // Keep chip square if present
          '& .MuiChip-root': { height: 22, borderRadius: 0 },
          '&.Mui-selected .MuiChip-root': { textDecoration: 'none !important' },

          // Keep square in all states
          '&:hover': { borderRadius: 0 },
          '&:focus, &:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.24)}`, borderRadius: 0 },
          '&.Mui-focusVisible': { borderRadius: 0, boxShadow: 'none' },

          // Selected tab: remove bottom border and overlap by 1px to "erase" the row line
          '&.Mui-selected': {
            borderRadius: 0,
            backgroundColor: '#fff',
            borderBottomColor: 'transparent',
            marginBottom: -1,
            position: 'relative',
            border: `1px solid ${theme.palette.grey[700]}`,
            zIndex: 3,
            color: 'black',
            textDecoration: 'none',
            fontWeight: 700,
          },
          '&.Mui-selected.Mui-focusVisible': {
            borderRadius: 0,
            outline: 'none',
            boxShadow: 'none',
            borderBottomColor: 'transparent',
            marginBottom: -1,
          },

          '::before, ::after': { borderRadius: 0 },
        }),
      },
    },

    // MuiDataGrid styles
    MuiDataGrid: {
      defaultProps: {
        disableColumnMenu: true,
        hideFooter: true,
        density: 'comfortable',
        showCellVerticalBorder: false,
        showColumnVerticalBorder: false,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 0,

          // Base grid lines (apply to all statuses)
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.grey[100],
            fontWeight: 700,
            borderTop: 0,
            borderLeft: `1px solid ${theme.palette.grey[700]}`,
            borderBottom: `1px solid ${theme.palette.grey[700]}`,
          },
          '& .MuiDataGrid-columnHeader': {
            borderRight: `1px solid ${theme.palette.grey[700]}`,
            fontWeight: 700,
            borderTop: 0,
            borderBottom: `1px solid ${theme.palette.grey[700]}`,
            /** Make header cells transparent so the container background shows uniformly */
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: 'transparent' },
            '&.MuiDataGrid-columnHeader--moving': { backgroundColor: 'transparent' },
            '&:focus, &:focus-within': { backgroundColor: 'transparent', outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2},
          },
          '& .MuiDataGrid-columnHeaderTitleContainer, & .MuiDataGrid-iconButtonContainer': {
            opacity: 1,
          },
          '& .MuiDataGrid-row': {
            borderBottom: `1px solid ${theme.palette.grey[400]}`,
          },
          '& .MuiDataGrid-columnSeparator': {
            visibility: 'visible',
            '& svg': { color: theme.palette.grey[400] },
          },

          /** ---- Status-scoped rules (root has data-status) ---- */
          '&[data-status="SUCCESS"] .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.app.headerTone.successBg,
          },
          '&[data-status="FAILED"] .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.app.headerTone.failedBg,
          },
          '&[data-status="PENDING"] .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.app.headerTone.pendingBg,
          },
        }),
      },
    },
  },
})

export default theme
