import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import { getPublicAvailability, requestBooking } from '../services/bookings.service';
import { formatDateTime } from '../lib/format';
import { queryClient } from '../lib/queryClient';

function toLocalInput(date: Date) { return date.toISOString().slice(0, 16); }

export default function AvailabilityPage() {
  const today = useMemo(() => new Date(), []);
  const week = new Date(today); week.setDate(today.getDate() + 7);
  const [start, setStart] = useState(toLocalInput(today));
  const [end, setEnd] = useState(toLocalInput(new Date(today.getTime() + 60 * 60 * 1000)));
  const availability = useQuery({ queryKey: ['availability'], queryFn: () => getPublicAvailability(today.toISOString().slice(0,10), week.toISOString().slice(0,10)) });
  const mutation = useMutation({ mutationFn: () => requestBooking({ requested_start: new Date(start).toISOString(), requested_end: new Date(end).toISOString() }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking-requests'] }) });
  return <Stack spacing={2}><Typography variant="h4">Availability</Typography>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">Booking request submitted.</Alert>}<Card><CardContent><Stack spacing={2}><Typography variant="h6">Request a booking</Typography><TextField label="Start" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} InputLabelProps={{ shrink: true }} /><TextField label="End" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} /><Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Request slot</Button></Stack></CardContent></Card>{availability.isLoading ? <LoadingScreen /> : <DataTable rows={availability.data ?? []} columns={[{ key: 'slot_start', header: 'Slot start', render: r => formatDateTime(r.slot_start) }, { key: 'slot_end', header: 'Slot end', render: r => formatDateTime(r.slot_end) }, { key: 'available', header: 'Available' }]} />}</Stack>;
}
