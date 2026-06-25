import { supabase } from '../lib/supabase';

export type MonthlyAvailabilitySlot = {
  slot_date: string;
  slot_start: string;
  slot_end: string;
  is_free: boolean;
  has_session: boolean;
  session_id: string | null;
  session_title: string | null;
  focus_area: string | null;
  can_request_booking: boolean;
  can_request_reschedule: boolean;
  can_request_shared_session: boolean;
  participant_count: number;
  shared_discount_percent: number;
};

export type SharedSessionRequestRow = {
  id: string;
  source_session_id: string;
  direction?: 'incoming' | 'outgoing';
  requester_name?: string | null;
  target_customer_name?: string | null;
  requester_status: 'pending' | 'accepted' | 'declined' | 'expired';
  trainer_status: 'pending' | 'accepted' | 'declined' | 'expired';
  start_at: string;
  end_at: string;
  session_title: string | null;
  focus_area: string | null;
  discount_percent: number;
  created_at: string;
};

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

export async function requestReschedule(input: { sessionId: string; requested_start: string; requested_end: string; reason?: string }) {
  const { data, error } = await supabase.rpc('request_reschedule', {
    session_id: input.sessionId,
    requested_start: input.requested_start,
    requested_end: input.requested_end,
    reason: input.reason ?? null,
  });
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

export async function getMonthlyAvailability(startDate: string, endDate: string, focusFilter?: string): Promise<MonthlyAvailabilitySlot[]> {
  const { data, error } = await supabase.rpc('get_customer_month_availability', {
    start_date: startDate,
    end_date: endDate,
    focus_filter: focusFilter && focusFilter !== 'all' ? focusFilter : null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function requestSharedSession(input: { sourceSessionId: string; notes?: string }) {
  const { data, error } = await supabase.rpc('request_shared_session', {
    source_session_id: input.sourceSessionId,
    notes: input.notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function listMySharedSessionRequests(): Promise<SharedSessionRequestRow[]> {
  const { data, error } = await supabase.rpc('get_my_shared_session_requests');
  if (error) throw error;
  return data ?? [];
}

export async function respondSharedSessionRequest(input: { requestId: string; decision: 'accepted' | 'declined' }) {
  const { data, error } = await supabase.rpc('respond_shared_session_request', {
    request_id: input.requestId,
    decision: input.decision,
  });
  if (error) throw error;
  return data;
}

export async function listAdminSharedSessionRequests(): Promise<SharedSessionRequestRow[]> {
  const { data, error } = await supabase.rpc('get_admin_shared_session_requests');
  if (error) throw error;
  return data ?? [];
}

export async function decideSharedSessionAsTrainer(input: { requestId: string; decision: 'accepted' | 'declined' }) {
  const { data, error } = await supabase.rpc('trainer_decide_shared_session_request', {
    request_id: input.requestId,
    decision: input.decision,
  });
  if (error) throw error;
  return data;
}
