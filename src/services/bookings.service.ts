import { supabase } from '../lib/supabase';

export async function listBookingRequests() {
  const { data, error } = await supabase.from('booking_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function requestBooking(input: { requested_start: string; requested_end: string; notes?: string }) {
  const { data, error } = await supabase.rpc('request_booking', input);
  if (error) throw error;
  return data;
}

export async function acceptBookingRequest(requestId: string) {
  const { data, error } = await supabase.rpc('accept_booking_request', { request_id: requestId });
  if (error) throw error;
  return data;
}

export async function declineBookingRequest(requestId: string, reason: string) {
  const { error } = await supabase.rpc('decline_booking_request', { request_id: requestId, reason });
  if (error) throw error;
}

export async function getPublicAvailability(startDate: string, endDate: string) {
  const { data, error } = await supabase.rpc('get_public_availability', { start_date: startDate, end_date: endDate });
  if (error) throw error;
  return data ?? [];
}
