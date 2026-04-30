import { Spinner } from './Card';

export function FullscreenLoader({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F7F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: '#C0395B',
      }}
    >
      <Spinner size={28} />
      <p style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500, margin: 0 }}>{message}</p>
    </div>
  );
}
