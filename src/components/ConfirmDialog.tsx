import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useI18n } from '../lib/i18n';

export default function ConfirmDialog({ open, title, message, onClose, onConfirm }: { open: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  const { t } = useI18n();
  return <Dialog open={open} onClose={onClose}><DialogTitle>{title}</DialogTitle><DialogContent><Typography>{message}</Typography></DialogContent><DialogActions><Button variant="outlined" onClick={onClose}>{t('common.cancel')}</Button><Button color="error" onClick={onConfirm}>{t('common.confirm')}</Button></DialogActions></Dialog>;
}
