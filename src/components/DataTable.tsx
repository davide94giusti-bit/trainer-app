import type React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import EmptyState from './EmptyState';

type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode };

export default function DataTable<T extends Record<string, any>>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  if (!rows.length) return <EmptyState />;
  return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow>{columns.map(c => <TableCell key={c.key}>{c.header}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row, idx) => <TableRow key={row.id ?? idx}>{columns.map(c => <TableCell key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? '-')}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>;
}
