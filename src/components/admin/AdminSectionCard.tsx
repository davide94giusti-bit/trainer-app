import { Card, CardContent, Stack, Typography } from '@mui/material';
import type React from 'react';

export default function AdminSectionCard({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return <Card><CardContent><Stack spacing={2}><Stack spacing={0.5}><Typography variant="h6">{title}</Typography>{description && <Typography variant="body2" color="text.secondary">{description}</Typography>}</Stack>{children}</Stack></CardContent></Card>;
}
