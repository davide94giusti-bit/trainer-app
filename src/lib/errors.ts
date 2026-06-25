export function errorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') return (error as any).message;
  return 'Unexpected error';
}
