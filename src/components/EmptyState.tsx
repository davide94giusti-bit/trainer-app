import { Box, Typography } from '@mui/material';
import { useI18n } from '../lib/i18n';

export default function EmptyState({ title, detail }: { title?: string; detail?: string }) {
  const { t } = useI18n();
  return <Box p={4} textAlign="center"><Typography variant="h6">{title ?? t('common.empty')}</Typography>{detail && <Typography color="text.secondary">{detail}</Typography>}</Box>;
}
