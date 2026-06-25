import { Box, CircularProgress, Typography } from '@mui/material';
import { useI18n } from '../lib/i18n';

export default function LoadingScreen() {
  const { t } = useI18n();
  return <Box minHeight="60vh" display="grid" alignItems="center" justifyContent="center" gap={2}><CircularProgress /><Typography>{t('common.loading')}</Typography></Box>;
}
