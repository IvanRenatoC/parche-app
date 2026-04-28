import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Notification } from '../types';

export async function getNotifications(uid: string): Promise<Notification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('recipient_uid', '==', uid),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const notifications = await getNotifications(uid);
  const unread = notifications.filter(n => !n.read);
  await Promise.all(unread.map(n => markNotificationRead(n.id)));
}
