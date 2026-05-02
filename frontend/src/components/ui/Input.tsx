import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  CSSProperties,
} from 'react';
import type { FieldError } from 'react-hook-form';

const fieldWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
};

const labelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7280',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const baseInputStyle = (hasError: boolean): CSSProperties => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: '12px',
  border: `2px solid ${hasError ? '#DC2626' : 'transparent'}`,
  fontSize: '14px',
  background: hasError ? '#FEF2F2' : '#F2F1EF',
  color: '#111827',
  outline: 'none',
  transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
});

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError | string;
  hint?: string;
}

export function Input({ label, error, hint, id, ...props }: InputProps) {
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <div style={fieldWrapStyle}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={baseInputStyle(!!errorMsg)}
        onFocus={(e) => {
          if (!errorMsg) {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#C0395B';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192, 57, 91, 0.12)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = errorMsg ? '#FEF2F2' : '#F2F1EF';
          e.currentTarget.style.borderColor = errorMsg ? '#DC2626' : 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {hint && !errorMsg && <p style={hintStyle}>{hint}</p>}
      {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: FieldError | string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, hint, id, options, placeholder, disabled, ...props }: SelectProps) {
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <div style={fieldWrapStyle}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <select
        id={id}
        disabled={disabled}
        style={{
          ...baseInputStyle(!!errorMsg),
          appearance: 'none',
          background: (() => {
            const bg = errorMsg ? '#FEF2F2' : disabled ? '#F5F4F2' : '#F2F1EF';
            const arrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
            return `${bg} ${arrow} no-repeat right 14px center`;
          })(),
          paddingRight: '36px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={(e) => {
          if (!errorMsg && !disabled) {
            e.currentTarget.style.background = `#FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 14px center`;
            e.currentTarget.style.borderColor = '#C0395B';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192, 57, 91, 0.12)';
          }
        }}
        onBlur={(e) => {
          const bg = errorMsg ? '#FEF2F2' : '#F2F1EF';
          e.currentTarget.style.background = `${bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 14px center`;
          e.currentTarget.style.borderColor = errorMsg ? '#DC2626' : 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !errorMsg && <p style={hintStyle}>{hint}</p>}
      {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: FieldError | string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, ...props }: TextareaProps) {
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <div style={fieldWrapStyle}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        style={{
          ...baseInputStyle(!!errorMsg),
          resize: 'vertical',
          minHeight: '84px',
          fontFamily: 'inherit',
          lineHeight: '1.5',
        }}
        onFocus={(e) => {
          if (!errorMsg) {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#C0395B';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192, 57, 91, 0.12)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = errorMsg ? '#FEF2F2' : '#F2F1EF';
          e.currentTarget.style.borderColor = errorMsg ? '#DC2626' : 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {hint && !errorMsg && <p style={hintStyle}>{hint}</p>}
      {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
    </div>
  );
}

const hintStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9CA3AF',
  margin: 0,
  lineHeight: 1.4,
};
const errorStyle: CSSProperties = {
  fontSize: '12px',
  color: '#DC2626',
  margin: 0,
  fontWeight: 500,
  lineHeight: 1.4,
};
