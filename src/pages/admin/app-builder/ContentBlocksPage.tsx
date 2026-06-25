import React from 'react';
import { Alert, Button, Card, CardContent, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import LocalizedJsonEditor from '../../../components/admin/LocalizedJsonEditor';
import LoadingScreen from '../../../components/LoadingScreen';
import { listContentBlocks, saveContentBlock, type ContentBlock } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';

export default function ContentBlocksPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['app-content-blocks'], queryFn: listContentBlocks });
  const mutation = useMutation({ mutationFn: saveContentBlock, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-content-blocks'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.content.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}{(query.data ?? []).map(block => <ContentBlockCard key={block.key} block={block} onSave={b => mutation.mutate(b)} saving={mutation.isPending} />)}</Stack>;
}

function ContentBlockCard({ block, onSave, saving }: { block: ContentBlock; onSave: (block: ContentBlock) => void; saving: boolean }) {
  const { t } = useI18n();
  const contentLabels: Record<string, string> = { dashboard_welcome: t('appBuilder.content.dashboardWelcome'), booking_instructions: t('appBuilder.content.bookingInstructions'), cancellation_policy: t('appBuilder.content.cancellationPolicy'), payment_instructions: t('appBuilder.content.paymentInstructions'), bank_transfer_instructions: t('appBuilder.content.bankTransferInstructions'), workout_instructions: t('appBuilder.content.workoutInstructions'), metrics_explanation: t('appBuilder.content.metricsExplanation'), notification_footer: t('appBuilder.content.notificationFooter'), support_help: t('appBuilder.content.supportHelp') };
  const translatedLabel = contentLabels[block.key] ?? block.label;
  const [draft, setDraft] = React.useState(block);
  React.useEffect(() => setDraft(block), [block]);
  return <Card><CardContent><Stack spacing={2}><Typography variant="h6">{translatedLabel}</Typography><LocalizedJsonEditor value={draft.localized_value} onChange={localized_value => setDraft({ ...draft, localized_value })} /><FormControlLabel control={<Switch checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} />} label={draft.enabled ? t('common.enabled') : t('common.disabled')} /><Button variant="contained" onClick={() => onSave(draft)} disabled={saving}>{t('common.save')}</Button></Stack></CardContent></Card>;
}
