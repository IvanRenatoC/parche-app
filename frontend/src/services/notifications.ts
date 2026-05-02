import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Notification, NotificationType, UserRole } from '../types';

interface CreateNotificationInput {
  recipient_uid?: string;
  recipient_role?: UserRole | '';
  type: NotificationType;
  title: string;
  message: string;
  related_job_post_id?: string | null;
  related_application_id?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<string> {
  const ref = await addDoc(collection(db, 'notifications'), {
    recipient_uid: input.recipient_uid ?? '',
    recipient_role: input.recipient_role ?? '',
    type: input.type,
    title: input.title,
    message: input.message,
    related_job_post_id: input.related_job_post_id ?? null,
    related_application_id: input.related_application_id ?? null,
    read: false,
    read_by: [],
    created_at: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Returns notifications relevant to the user: directs addressed to them plus
 * role-based broadcasts. Sorted desc by created_at client-side.
 */
export async function getNotifications(uid: string, role: UserRole): Promise<Notification[]> {
  const directQ = query(collection(db, 'notifications'), where('recipient_uid', '==', uid));
  const broadcastQ = query(collection(db, 'notifications'), where('recipient_role', '==', role));

  const [directSnap, broadcastSnap] = await Promise.all([getDocs(directQ), getDocs(broadcastQ)]);
  const map = new Map<string, Notification>();
  for (const d of directSnap.docs) {
    map.set(d.id, { id: d.id, ...d.data() } as Notification);
  }
  for (const d of broadcastSnap.docs) {
    if (!map.has(d.id)) map.set(d.id, { id: d.id, ...d.data() } as Notification);
  }
  const list = Array.from(map.values());
  return list.sort((a, b) => {
    const ta = (a.created_at as unknown as { seconds?: number } | null)?.seconds ?? 0;
    const tb = (b.created_at as unknown as { seconds?: number } | null)?.seconds ?? 0;
    return tb - ta;
  });
}

/** True if the notification is unread for this user (handles direct + broadcast). */
export function isNotificationUnread(n: Notification, uid: string): boolean {
  if (n.recipient_uid && n.recipient_uid === uid) return !n.read;
  if (n.recipient_role) return !(n.read_by ?? []).includes(uid);
  return false;
}

export async function markNotificationRead(notification: Notification, uid: string): Promise<void> {
  if (notification.recipient_uid && notification.recipient_uid === uid) {
    await updateDoc(doc(db, 'notifications', notification.id), { read: true });
    return;
  }
  if (notification.recipient_role) {
    await updateDoc(doc(db, 'notifications', notification.id), { read_by: arrayUnion(uid) });
  }
}

export async function markAllNotificationsRead(uid: string, role: UserRole): Promise<void> {
  const list = await getNotifications(uid, role);
  const unread = list.filter((n) => isNotificationUnread(n, uid));
  await Promise.all(unread.map((n) => markNotificationRead(n, uid)));
}
