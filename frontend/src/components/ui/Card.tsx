import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = { none: '0', sm: '14px', md: '22px', lg: '32px' };

export function Card({ children, padding = 'md', className = '', style, ...props }: CardProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)',
        padding: paddingMap[padding],
        border: '1px solid #ECE7DD',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

const badgeColors = {
  gray: { bg: '#F3F4F6', text: '#374151' },
  green: { bg: '#DCFCE7', text: '#166534' },
  amber: { bg: '#FEF3C7', text: '#92400E' },
  pink: { bg: '#FCE7F3', text: '#9D174D' },
  red: { bg: '#FEE2E2', text: '#991B1B' },
  blue: { bg: '#DBEAFE', text: '#1E40AF' },
} as const;

export function Badge({
  children,
  color = 'gray',
}: {
  children: ReactNode;
  color?: keyof typeof badgeColors;
}) {
  const c = badgeColors[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {children}
    </span>
  );
}

const spinnerStyle: CSSProperties = {
  display: 'inline-block',
  color: 'inherit',
};

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="spinner"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={spinnerStyle}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
      <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" />
    </svg>
  );
}
