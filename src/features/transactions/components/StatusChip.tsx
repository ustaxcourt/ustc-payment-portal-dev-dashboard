import Chip, { type ChipProps } from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import type { TabStatus } from '../types';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: TabStatus;
}

type StatusColors = {
  bg: string;
  fg: string;
};

export function StatusChip({ status, ...props }: StatusChipProps) {
  const theme = useTheme();
  const colors: StatusColors = {
    ALL: {
      bg: '#e8eaf6',
      fg: theme.palette.primary.main,
    },
    SUCCESS: {
      bg: theme.palette.success.light,
      fg: theme.palette.success.main,
    },
    FAILED: {
      bg: theme.palette.failed.light,
      fg: theme.palette.failed.main,
    },
    PENDING: {
      bg: theme.palette.pending.light,
      fg: theme.palette.pending.main,
    },
  }[status];

  return (
    <Chip
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 15,
        p: 1,
        bgcolor: colors.bg,
        color: colors.fg,
        borderColor: 'transparent',
        borderWidth: 1,
        borderStyle: 'solid',
        '& .MuiChip-label': { px: 1 },
      }}
      {...props}
    />
  );
}
