import { Button, List, ListItem, ListItemText, Stack, Switch, TextField } from '@mui/material';
import { useI18n } from '../../lib/i18n';

export type SortableItem = { key: string; label: string; enabled: boolean; sort_order: number };

export default function SortableWidgetList({ items, onChange }: { items: SortableItem[]; onChange: (items: SortableItem[]) => void }) {
  const { t } = useI18n();
  function update(key: string, patch: Partial<SortableItem>) {
    onChange(items.map(item => item.key === key ? { ...item, ...patch } : item));
  }
  return <List>{items.map(item => <ListItem key={item.key} divider secondaryAction={<Stack direction="row" spacing={1} alignItems="center"><TextField label={t('common.order')} size="small" type="number" value={item.sort_order} onChange={event => update(item.key, { sort_order: Number(event.target.value) })} sx={{ width: 92 }} /><Switch checked={item.enabled} onChange={event => update(item.key, { enabled: event.target.checked })} /></Stack>}><ListItemText primary={item.label} secondary={item.key} /></ListItem>)}</List>;
}
