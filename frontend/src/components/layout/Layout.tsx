import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F7F5' }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1160px',
          margin: '0 auto',
          padding: '28px 24px 80px',
        }}
      >
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
        background: '#F8F7F5',
        padding: '32px 20px',
      }}
    >
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#C0395B',
            letterSpacing: '-1.5px',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Parche
        </h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px', fontWeight: 400 }}>
          Conectamos locales con personas que quieren trabajar
        </p>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}
