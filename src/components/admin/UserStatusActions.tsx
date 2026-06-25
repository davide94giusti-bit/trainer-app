import { Button, Stack } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { deactivateUser, reactivateUser, resetUserOnboarding } from '../../services/adminUsers.service';
import { queryClient } from '../../lib/queryClient';
import { useI18n } from '../../lib/i18n';
import type { UserStatus } from '../../types/domain';

export default function UserStatusActions({ userId, status, invalidateKey }: { userId: string; status: UserStatus; invalidateKey?: unknown[] }) {
  const { t } = useI18n();
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: invalidateKey ?? ['profile', userId] });
    queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };
  const deactivate = useMutation({ mutationFn: () => deactivateUser(userId), onSuccess });
  const reactivate = useMutation({ mutationFn: () => reactivateUser(userId), onSuccess });
  const reset = useMutation({ mutationFn: () => resetUserOnboarding(userId), onSuccess });

  return <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    <Button color="error" variant="outlined" disabled={status === 'deactivated' || deactivate.isPending} onClick={() => window.confirm(t('admin.user.deactivateConfirm')) && deactivate.mutate()}>{t('common.deactivate')}</Button>
    <Button color="success" variant="outlined" disabled={status === 'active' || reactivate.isPending} onClick={() => window.confirm(t('admin.user.reactivateConfirm')) && reactivate.mutate()}>{t('common.reactivate')}</Button>
    <Button variant="outlined" disabled={reset.isPending} onClick={() => reset.mutate()}>{t('common.resetInvite')}</Button>
  </Stack>;
}
