import { Chip, ChipProps } from '@mui/material';

export default function StatusChip({ status }: { status?: string | null }) {
  const color: ChipProps['color'] = status?.includes('active') || status === 'completed' || status === 'accepted' ? 'success' : status === 'pending' || status === 'invited' ? 'warning' : status === 'cancelled' || status === 'rejected' || status === 'deactivated' ? 'error' : 'default';
  return <Chip size="small" label={status ?? '-'} color={color} />;
}
