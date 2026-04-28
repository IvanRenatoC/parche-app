import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f2f3f5' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #f2f3f5 50%, #fff 100%)',
        padding: '24px 16px',
      }}
    >
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 800,
            color: '#ad4b7e',
            letterSpacing: '-1px',
            margin: 0,
          }}
        >
          Parche
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Conectamos locales con talento temporal
        </p>
      </div>
      {children}
    </div>
  );
}
