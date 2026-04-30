import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = { none: '0', sm: '14px', md: '20px', lg: '28px' };

export function Card({ children, padding = 'md', className = '', style, ...props }: CardProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
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

const badgeColors = {
  gray:   { bg: '#F3F4F6', text: '#4B5563' },
  green:  { bg: '#ECFDF5', text: '#059669' },
  amber:  { bg: '#FFFBEB', text: '#D97706' },
  pink:   { bg: '#FEF0F4', text: '#C0395B' },
  red:    { bg: '#FEF2F2', text: '#DC2626' },
  blue:   { bg: '#EFF6FF', text: '#2563EB' },
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
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '11.5px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        background: c.bg,
        color: c.text,
        whiteSpace: 'nowrap',
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
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" />
    </svg>
  );
}
