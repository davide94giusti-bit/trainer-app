import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <Card><CardContent><Stack spacing={0.75}><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4">{value}</Typography>{detail && <Typography color="text.secondary" variant="caption">{detail}</Typography>}</Stack></CardContent></Card>;
}
