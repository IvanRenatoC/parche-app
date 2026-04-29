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
}

const variantMap: Record<Variant, VariantStyle> = {
  primary: { bg: '#1F1F1F', color: '#FFFFFF', border: '#1F1F1F', hoverBg: '#000000' },
  secondary: { bg: '#FFFFFF', color: '#1F1F1F', border: '#ECE7DD', hoverBg: '#F7F4EF' },
  outline: { bg: 'transparent', color: '#1F1F1F', border: '#1F1F1F', hoverBg: '#F7F4EF' },
  ghost: { bg: 'transparent', color: '#ad4b7e', border: 'transparent', hoverBg: '#FCE7F3' },
  danger: { bg: '#ef4444', color: '#FFFFFF', border: '#ef4444', hoverBg: '#dc2626' },
};

const sizeMap: Record<Size, { padding: string; fontSize: string; radius: string }> = {
  sm: { padding: '7px 14px', fontSize: '13px', radius: '8px' },
  md: { padding: '10px 18px', fontSize: '14px', radius: '10px' },
  lg: { padding: '12px 22px', fontSize: '15px', radius: '12px' },
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
    fontWeight: 600,
    transition: 'all 0.15s',
    background: hover && !isDisabled ? v.hoverBg : v.bg,
    color: v.color,
    border: `1.5px solid ${v.border}`,
    padding: s.padding,
    fontSize: s.fontSize,
    borderRadius: s.radius,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.55 : 1,
    width: fullWidth ? '100%' : undefined,
    gap: '6px',
    fontFamily: 'inherit',
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
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
          <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" opacity="0.85" />
        </svg>
      )}
      {children}
    </button>
  );
}
