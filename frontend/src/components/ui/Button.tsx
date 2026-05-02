import { useState, type ButtonHTMLAttributes, type ReactNode, type CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

interface VariantStyle {
  bg: string;
  color: string;
  border: string;
  hoverBg: string;
  hoverBorder: string;
}

const variantMap: Record<Variant, VariantStyle> = {
  primary: {
    bg: '#C0395B',
    color: '#FFFFFF',
    border: 'transparent',
    hoverBg: '#A52F4E',
    hoverBorder: 'transparent',
  },
  secondary: {
    bg: '#FFFFFF',
    color: '#111827',
    border: '#E8E5E0',
    hoverBg: '#F8F7F5',
    hoverBorder: '#D1CEC9',
  },
  outline: {
    bg: 'transparent',
    color: '#C0395B',
    border: '#C0395B',
    hoverBg: '#FEF0F4',
    hoverBorder: '#C0395B',
  },
  ghost: {
    bg: 'transparent',
    color: '#C0395B',
    border: 'transparent',
    hoverBg: '#FEF0F4',
    hoverBorder: 'transparent',
  },
  danger: {
    bg: '#DC2626',
    color: '#FFFFFF',
    border: 'transparent',
    hoverBg: '#B91C1C',
    hoverBorder: 'transparent',
  },
};

const sizeMap: Record<Size, { padding: string; fontSize: string; radius: string; gap: string }> = {
  sm:  { padding: '7px 14px',  fontSize: '13px', radius: '10px',  gap: '5px' },
  md:  { padding: '10px 20px', fontSize: '14px', radius: '12px',  gap: '6px' },
  lg:  { padding: '13px 28px', fontSize: '15px', radius: '999px', gap: '7px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const isDisabled = disabled || loading;
  const v = variantMap[variant];
  const s = sizeMap[size];

  const merged: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s, opacity 0.15s',
    background: hover && !isDisabled ? v.hoverBg : v.bg,
    color: v.color,
    border: `1.5px solid ${hover && !isDisabled ? v.hoverBorder : v.border}`,
    padding: s.padding,
    fontSize: s.fontSize,
    borderRadius: s.radius,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    fontFamily: 'inherit',
    boxShadow: variant === 'primary' && !isDisabled && hover
      ? '0 4px 12px rgba(192, 57, 91, 0.3)'
      : 'none',
    ...style,
  };

  return (
    <button
      disabled={isDisabled}
      style={merged}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {loading && (
        <svg
          className="spinner"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" />
        </svg>
      )}
      {children}
    </button>
  );
}
