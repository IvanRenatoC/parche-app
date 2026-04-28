import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-black text-white hover:bg-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-black',
  secondary: 'bg-[#f2f3f5] text-gray-800 hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-300',
  outline: 'border border-black text-black hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-black',
  ghost: 'text-[#ad4b7e] hover:bg-pink-50 focus:ring-2 focus:ring-offset-2 focus:ring-pink-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
};

const sizeStyles: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 rounded-lg',
  lg: 'text-base px-6 py-3 rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      style={{ border: variant === 'outline' ? '1px solid #000' : 'none' }}
      {...props}
    >
      {loading && (
        <svg
          className="spinner mr-2 -ml-1 w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
