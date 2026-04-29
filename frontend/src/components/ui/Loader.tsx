import { Spinner } from './Card';

export function FullscreenLoader({ message }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F4EF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: '#6B7280',
      }}
    >
      <div style={{ color: '#ad4b7e' }}>
        <Spinner size={32} />
      </div>
      {message && (
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>{message}</p>
      )}
    </div>
  );
}
