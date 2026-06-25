import { Breadcrumbs, Stack, Typography } from '@mui/material';
import type React from 'react';
import { useI18n } from '../../lib/i18n';

export default function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <Stack spacing={1} mb={1}>
      <Breadcrumbs aria-label="breadcrumb"><Typography color="text.secondary">{t('nav.admin')}</Typography><Typography color="text.primary">{title}</Typography></Breadcrumbs>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
        <BoxTitle title={title} subtitle={subtitle} />
        {action ?? null}
      </Stack>
    </Stack>
  );
}

function BoxTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return <Stack spacing={0.5}><Typography variant="h4">{title}</Typography>{subtitle && <Typography color="text.secondary">{subtitle}</Typography>}</Stack>;
}
