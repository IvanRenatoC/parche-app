import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = { none: '0', sm: '12px', md: '20px', lg: '28px' };

export function Card({ children, padding = 'md', className = '', style, ...props }: CardProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        padding: paddingMap[padding],
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = 'gray',
}: {
  children: ReactNode;
  color?: 'gray' | 'green' | 'amber' | 'pink' | 'red' | 'blue';
}) {
  const colors = {
    gray: { bg: '#f2f3f5', text: '#374151' },
    green: { bg: '#dcfce7', text: '#166534' },
    amber: { bg: '#fef3c7', text: '#92400e' },
    pink: { bg: '#fce7f3', text: '#831843' },
    red: { bg: '#fee2e2', text: '#991b1b' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
  };
  const c = colors[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        background: c.bg,
        color: c.text,
      }}
    >
      {children}
    </span>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="spinner"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
