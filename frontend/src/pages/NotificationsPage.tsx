import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { Card, Spinner } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getNotifications,
  isNotificationUnread,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications';
import type { Notification } from '../types';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';

export function NotificationsPage() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  async function fetchNotifications() {
    if (!appUser) return;
    setLoading(true);
    try {
      const data = await getNotifications(appUser.uid, appUser.role);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotifications(); }, [appUser]);

  async function handleMarkAllRead() {
    if (!appUser) return;
    setMarkingAll(true);
    await markAllNotificationsRead(appUser.uid, appUser.role);
    await fetchNotifications();
    setMarkingAll(false);
  }

  async function handleMarkRead(n: Notification) {
    if (!appUser) return;
    await markNotificationRead(n, appUser.uid);
    setNotifications((prev) =>
      prev.map((x) =>
        x.id === n.id
          ? x.recipient_role
            ? { ...x, read_by: [...(x.read_by ?? []), appUser.uid] }
            : { ...x, read: true }
          : x
      )
    );
  }

  function handleOpen(n: Notification) {
    if (appUser && isNotificationUnread(n, appUser.uid)) {
      // Marcar como leída sin esperar (navegamos igual).
      void handleMarkRead(n);
    }
    if (n.related_job_post_id) {
      const params = new URLSearchParams();
      params.set('postId', n.related_job_post_id);
      if (n.related_application_id) {
        params.set('applicationId', n.related_application_id);
      }
      navigate(`/marketplace?${params.toString()}`);
    }
  }

  const unreadCount = appUser
    ? notifications.filter((n) => isNotificationUnread(n, appUser.uid)).length
    : 0;

  return (
    <Layout>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Notificaciones</h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: '13px', color: '#C0395B', marginTop: '4px' }}>{unreadCount} sin leer</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" loading={markingAll} onClick={handleMarkAllRead}>
              <CheckCheck size={15} style={{ marginRight: '6px' }} /> Marcar todas como leídas
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <Bell size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Sin notificaciones</p>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '6px' }}>
              Te avisaremos cuando haya novedades sobre tus publicaciones o postulaciones.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                unread={appUser ? isNotificationUnread(n, appUser.uid) : false}
                onOpen={() => handleOpen(n)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function formatNotificationTime(ts: unknown): string {
  if (!ts) return '';
  // Firestore Timestamp viene como { seconds, nanoseconds } (o _seconds tras serialización REST).
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as { seconds?: number; _seconds?: number };
    const seconds = obj.seconds ?? obj._seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toLocaleString('es-CL');
    }
  }
  // Fallback: ISO string o ms epoch.
  const d = new Date(ts as string | number);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-CL');
}

function NotificationItem({
  notification,
  unread,
  onOpen,
}: {
  notification: Notification;
  unread: boolean;
  onOpen: () => void;
}) {
  const typeColors: Record<string, string> = {
    application_accepted: '#22c55e',
    application_not_selected: '#f59e0b',
    application_rejected: '#ef4444',
    application_withdrawn: '#f59e0b',
    job_post_filled: '#3b82f6',
    new_application: '#C0395B',
    new_job_post: '#3b82f6',
    general: '#6b7280',
  };

  const color = typeColors[notification.type] ?? '#6b7280';
  const isClickable = Boolean(notification.related_job_post_id);

  return (
    <Card
      padding="sm"
      style={{
        border: unread ? '1px solid #fce7f3' : '1px solid #f0f0f0',
        background: unread ? '#fdf4f8' : '#fff',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onClick={isClickable ? onOpen : undefined}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: unread ? color : '#e5e7eb',
            flexShrink: 0, marginTop: '4px',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: unread ? 600 : 400, color: '#111827', margin: '0 0 4px' }}>
            {notification.title}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            {notification.message}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>
        {isClickable && (
          <ChevronRight size={16} color="#9CA3AF" style={{ flexShrink: 0, marginTop: '6px' }} />
        )}
      </div>
    </Card>
  );
}
