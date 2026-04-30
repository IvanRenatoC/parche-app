import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { Card, Spinner } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications';
import type { Notification } from '../types';
import { Bell, CheckCheck } from 'lucide-react';

export function NotificationsPage() {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  async function fetchNotifications() {
    if (!appUser) return;
    setLoading(true);
    try {
      const data = await getNotifications(appUser.uid);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotifications(); }, [appUser]);

  async function handleMarkAllRead() {
    if (!appUser) return;
    setMarkingAll(true);
    await markAllNotificationsRead(appUser.uid);
    await fetchNotifications();
    setMarkingAll(false);
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <NotificationItem key={n.id} notification={n} onMarkRead={() => handleMarkRead(n.id)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: () => void }) {
  const typeColors: Record<string, string> = {
    application_accepted: '#22c55e',
    application_not_selected: '#f59e0b',
    application_rejected: '#ef4444',
    job_post_filled: '#3b82f6',
    new_application: '#C0395B',
    general: '#6b7280',
  };

  const color = typeColors[notification.type] ?? '#6b7280';

  return (
    <Card
      padding="sm"
      style={{
        border: notification.read ? '1px solid #f0f0f0' : '1px solid #fce7f3',
        background: notification.read ? '#fff' : '#fdf4f8',
        cursor: notification.read ? 'default' : 'pointer',
      }}
      onClick={!notification.read ? onMarkRead : undefined}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: notification.read ? '#e5e7eb' : color,
            flexShrink: 0, marginTop: '4px',
          }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: notification.read ? 400 : 600, color: '#111827', margin: '0 0 4px' }}>
            {notification.title}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            {notification.message}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
            {notification.created_at
              ? new Date(notification.created_at).toLocaleString('es-CL')
              : ''}
          </p>
        </div>
      </div>
    </Card>
  );
}
