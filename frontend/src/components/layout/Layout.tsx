import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

const PAGE_BG = '#F7F4EF';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PAGE_BG }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '28px 20px 64px',
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
        background: PAGE_BG,
        padding: '32px 16px',
      }}
    >
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 800,
            color: '#ad4b7e',
            letterSpacing: '-1px',
            margin: 0,
          }}
        >
          Parche
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '6px' }}>
          Conectamos locales con personas que quieren trabajar
        </p>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}
