import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

export default function ConfirmDialog({ open, title, message, onClose, onConfirm }: { open: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onClose={onClose}><DialogTitle>{title}</DialogTitle><DialogContent><Typography>{message}</Typography></DialogContent><DialogActions><Button variant="outlined" onClick={onClose}>Cancel</Button><Button color="error" onClick={onConfirm}>Confirm</Button></DialogActions></Dialog>;
}
