import { supabase } from '../lib/supabase';

export async function listNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.rpc('mark_notification_read', { notification_id: notificationId });
  if (error) throw error;
}

export async function createAdminAnnouncement(title: string, message: string, recipientMode = 'all') {
  const { error } = await supabase.rpc('create_admin_announcement', { title, message, recipient_mode: recipientMode });
  if (error) throw error;
}
