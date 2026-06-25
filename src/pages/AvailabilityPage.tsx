import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import DataTable from '../components/DataTable';
import {
  getMonthlyAvailability,
  listMySharedSessionRequests,
  requestBooking,
  requestReschedule,
  requestSharedSession,
  respondSharedSessionRequest,
  type MonthlyAvailabilitySlot,
} from '../services/bookings.service';
import { listMyUpcomingSessions } from '../services/sessions.service';
import { formatDateTime } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import { useI18n } from '../lib/i18n';

const DAY_MS = 24 * 60 * 60 * 1000;

const STANDARD_FOCUS_OPTIONS = ['Upper body', 'Lower body', 'Legs', 'Cardio', 'Core'];

function focusLabel(value: string, t: (key: string, fallbackOrVars?: string | Record<string, string | number>) => string) {
  const labels: Record<string, string> = {
    'Upper body': t('focus.upperBody'),
    'Lower body': t('focus.lowerBody'),
    Legs: t('focus.legs'),
    Cardio: t('focus.cardio'),
    Core: t('focus.core'),
  };
  return labels[value] ?? value;
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthLabel(date: Date, language: string) {
  return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(date);
}

function dayLabel(day: string, language: string) {
  return new Intl.DateTimeFormat(language, { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${day}T12:00:00`));
}

function timeRange(start: string, end: string, language: string) {
  const formatter = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function calendarDays(monthStart: Date) {
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const last = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getTime() - startOffset * DAY_MS);
  const endOffset = 6 - ((last.getDay() + 6) % 7);
  const gridEnd = new Date(last.getTime() + endOffset * DAY_MS);
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = new Date(d.getTime() + DAY_MS)) days.push(d);
  return days;
}

function groupByDate(slots: MonthlyAvailabilitySlot[]) {
  return slots.reduce<Record<string, MonthlyAvailabilitySlot[]>>((acc, slot) => {
    acc[slot.slot_date] = acc[slot.slot_date] ?? [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});
}

function sortSlots(slots: MonthlyAvailabilitySlot[]) {
  return [...slots].sort((a, b) => a.slot_start.localeCompare(b.slot_start));
}

export default function AvailabilityPage() {
  const { t, language } = useI18n();
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [focusFilter, setFocusFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rescheduleSessionId, setRescheduleSessionId] = useState('');

  const startDate = dateKey(new Date(monthStart.getFullYear(), monthStart.getMonth(), 1));
  const endDate = dateKey(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0));

  const availability = useQuery({
    queryKey: ['monthly-availability', startDate, endDate, focusFilter],
    queryFn: () => getMonthlyAvailability(startDate, endDate, focusFilter),
  });
  const upcomingSessions = useQuery({ queryKey: ['my-upcoming-sessions'], queryFn: listMyUpcomingSessions });
  const sharedRequests = useQuery({ queryKey: ['my-shared-session-requests'], queryFn: listMySharedSessionRequests });

  const booking = useMutation({
    mutationFn: (slot: MonthlyAvailabilitySlot) => requestBooking({ requested_start: slot.slot_start, requested_end: slot.slot_end }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-availability'] });
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
  });

  const reschedule = useMutation({
    mutationFn: (slot: MonthlyAvailabilitySlot) => requestReschedule({
      sessionId: rescheduleSessionId,
      requested_start: slot.slot_start,
      requested_end: slot.slot_end,
      reason: t('availability.rescheduleReason'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-availability'] });
      queryClient.invalidateQueries({ queryKey: ['my-upcoming-sessions'] });
    },
  });

  const shared = useMutation({
    mutationFn: (slot: MonthlyAvailabilitySlot) => requestSharedSession({ sourceSessionId: slot.session_id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-availability'] });
      queryClient.invalidateQueries({ queryKey: ['my-shared-session-requests'] });
    },
  });

  const respond = useMutation({
    mutationFn: (input: { requestId: string; decision: 'accepted' | 'declined' }) => respondSharedSessionRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shared-session-requests'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-availability'] });
    },
  });

  const slots = availability.data ?? [];
  const grouped = useMemo(() => groupByDate(slots), [slots]);
  const days = useMemo(() => calendarDays(monthStart), [monthStart]);
  const selectedSlots = selectedDay ? sortSlots(grouped[selectedDay] ?? []) : [];
  const focusOptions = useMemo(() => {
    const values = Array.from(new Set([...STANDARD_FOCUS_OPTIONS, ...((availability.data ?? []).map(slot => slot.focus_area).filter(Boolean) as string[])])).sort();
    return ['all', 'available', ...values];
  }, [availability.data]);
  const discountPercent = slots.find(slot => slot.shared_discount_percent !== null)?.shared_discount_percent ?? 40;

  const error = availability.error || booking.error || reschedule.error || shared.error || respond.error;
  const success = booking.isSuccess || reschedule.isSuccess || shared.isSuccess || respond.isSuccess;

  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
      <Box>
        <Typography variant="h4">{t('availability.title')}</Typography>
        <Typography color="text.secondary">{t('availability.subtitle')}</Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button variant="outlined" onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}>{t('availability.previousMonth')}</Button>
        <Typography minWidth={160} textAlign="center" fontWeight={700}>{monthLabel(monthStart, language)}</Typography>
        <Button variant="outlined" onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}>{t('availability.nextMonth')}</Button>
      </Stack>
    </Stack>

    {error && <Alert severity="error">{(error as Error).message}</Alert>}
    {success && <Alert severity="success">{t('availability.requestSubmitted')}</Alert>}

    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>{t('availability.sessionTypeFilter')}</InputLabel>
              <Select label={t('availability.sessionTypeFilter')} value={focusFilter} onChange={event => setFocusFilter(String(event.target.value))}>
                {focusOptions.map(option => <MenuItem key={option} value={option}>{option === 'all' ? t('availability.allSessionTypes') : option === 'available' ? t('availability.openAvailability') : focusLabel(option, t)}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography color="text.secondary">{t('availability.sharedDiscountNotice', { percent: discountPercent })}</Typography>
          </Stack>
          {availability.isLoading ? <LoadingScreen /> : <CalendarGrid days={days} activeMonth={monthStart.getMonth()} grouped={grouped} language={language} onSelectDay={setSelectedDay} />}
        </Stack>
      </CardContent>
    </Card>

    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{t('availability.sharedRequests')}</Typography>
          {sharedRequests.isLoading ? <LoadingScreen /> : <DataTable rows={sharedRequests.data ?? []} columns={[
            { key: 'direction', header: t('availability.requestType'), render: r => r.direction === 'incoming' ? t('availability.incomingRequest') : t('availability.outgoingRequest') },
            { key: 'session_title', header: t('availability.sessionTitle'), render: r => r.session_title ?? t('availability.trainingSession') },
            { key: 'start_at', header: t('common.start'), render: r => formatDateTime(r.start_at) },
            { key: 'requester_status', header: t('availability.customerApproval') },
            { key: 'trainer_status', header: t('availability.trainerApproval') },
            { key: 'actions', header: t('common.actions'), render: r => r.direction === 'incoming' && r.requester_status === 'pending' ? <Stack direction="row" spacing={1}><Button size="small" onClick={() => respond.mutate({ requestId: r.id, decision: 'accepted' })}>{t('common.accept')}</Button><Button size="small" color="error" onClick={() => respond.mutate({ requestId: r.id, decision: 'declined' })}>{t('common.decline')}</Button></Stack> : '-' },
          ]} />}
        </Stack>
      </CardContent>
    </Card>

    <Dialog open={!!selectedDay} onClose={() => setSelectedDay(null)} fullScreen>
      <DialogTitle>{selectedDay ? dayLabel(selectedDay, language) : t('availability.dayAvailability')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {selectedSlots.length === 0 && <Alert severity="info">{t('availability.noSlotsForDay')}</Alert>}
          {(upcomingSessions.data ?? []).length > 0 && <FormControl size="small" fullWidth>
            <InputLabel>{t('availability.sessionToReschedule')}</InputLabel>
            <Select label={t('availability.sessionToReschedule')} value={rescheduleSessionId} onChange={event => setRescheduleSessionId(String(event.target.value))}>
              <MenuItem value="">{t('availability.noRescheduleSelection')}</MenuItem>
              {(upcomingSessions.data ?? []).map((session: any) => <MenuItem key={session.id} value={session.id}>{formatDateTime(session.start_at)} - {session.focus_area ?? session.notes ?? t('availability.trainingSession')}</MenuItem>)}
            </Select>
          </FormControl>}
          {selectedSlots.map(slot => <SlotCard
            key={`${slot.slot_start}-${slot.session_id ?? 'free'}`}
            slot={slot}
            language={language}
            hasRescheduleSelection={!!rescheduleSessionId}
            onRequestBooking={() => booking.mutate(slot)}
            onRequestReschedule={() => reschedule.mutate(slot)}
            onRequestShared={() => shared.mutate(slot)}
            disabled={booking.isPending || reschedule.isPending || shared.isPending}
          />)}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={() => setSelectedDay(null)}>{t('common.close', 'Close')}</Button></DialogActions>
    </Dialog>
  </Stack>;
}

function CalendarGrid({ days, activeMonth, grouped, language, onSelectDay }: { days: Date[]; activeMonth: number; grouped: Record<string, MonthlyAvailabilitySlot[]>; language: string; onSelectDay: (day: string) => void }) {
  const { t } = useI18n();
  const weekdayLabels = useMemo(() => {
    const base = new Date(2026, 0, 5);
    return Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(language, { weekday: 'short' }).format(new Date(base.getTime() + index * DAY_MS)));
  }, [language]);
  return <Stack spacing={1}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1 }}>
      {weekdayLabels.map(label => <Typography key={label} variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>)}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1 }}>
      {days.map(day => {
        const key = dateKey(day);
        const daySlots = grouped[key] ?? [];
        const freeCount = daySlots.filter(slot => slot.is_free).length;
        const sharedCount = daySlots.filter(slot => slot.can_request_shared_session).length;
        const hasSlots = daySlots.length > 0;
        const outsideMonth = day.getMonth() !== activeMonth;
        return <Card
          key={key}
          variant="outlined"
          onClick={() => hasSlots && onSelectDay(key)}
          sx={{ minHeight: 118, cursor: hasSlots ? 'pointer' : 'default', opacity: outsideMonth ? 0.45 : 1, bgcolor: hasSlots ? 'background.paper' : 'action.hover' }}
        >
          <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
            <Stack spacing={1}>
              <Typography fontWeight={700}>{day.getDate()}</Typography>
              {freeCount > 0 && <Chip size="small" label={`${freeCount} ${t('availability.openSlots')}`} />}
              {sharedCount > 0 && <Chip size="small" color="primary" label={`${sharedCount} ${t('availability.sharedOptions')}`} />}
              {!hasSlots && <Typography variant="caption" color="text.secondary">{t('availability.noAvailability')}</Typography>}
            </Stack>
          </CardContent>
        </Card>;
      })}
    </Box>
  </Stack>;
}

function SlotCard({ slot, language, hasRescheduleSelection, onRequestBooking, onRequestReschedule, onRequestShared, disabled }: { slot: MonthlyAvailabilitySlot; language: string; hasRescheduleSelection: boolean; onRequestBooking: () => void; onRequestReschedule: () => void; onRequestShared: () => void; disabled: boolean }) {
  const { t } = useI18n();
  return <Card variant="outlined">
    <CardContent>
      <Stack spacing={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h6">{timeRange(slot.slot_start, slot.slot_end, language)}</Typography>
            <Typography color="text.secondary">{slot.has_session ? slot.session_title ?? t('availability.trainingSession') : t('availability.openAvailability')}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {slot.focus_area && <Chip label={focusLabel(slot.focus_area, t)} />}
            {slot.is_free ? <Chip color="success" label={t('availability.available')} /> : <Chip color="warning" label={t('availability.sessionBooked')} />}
          </Stack>
        </Stack>
        {slot.can_request_shared_session && <Alert severity="info">{t('availability.sharedSessionExplanation', { percent: slot.shared_discount_percent })}</Alert>}
      </Stack>
    </CardContent>
    <Divider />
    <CardActions sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {slot.can_request_booking && <Button disabled={disabled} onClick={onRequestBooking}>{t('availability.requestNewBooking')}</Button>}
      {slot.can_request_reschedule && <Button disabled={disabled || !hasRescheduleSelection} onClick={onRequestReschedule}>{t('availability.requestReschedule')}</Button>}
      {slot.can_request_shared_session && <Button variant="contained" disabled={disabled} onClick={onRequestShared}>{t('availability.requestSharedSession')}</Button>}
    </CardActions>
  </Card>;
}
