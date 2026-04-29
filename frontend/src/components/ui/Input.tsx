import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, CSSProperties } from 'react';
import type { FieldError } from 'react-hook-form';

const fieldWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#1F1F1F',
};

const baseInputStyle = (hasError: boolean): CSSProperties => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${hasError ? '#ef4444' : '#E5E7EB'}`,
  fontSize: '14px',
  background: '#FFFFFF',
  color: '#1F1F1F',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
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
          e.currentTarget.style.borderColor = errorMsg ? '#ef4444' : '#ad4b7e';
          e.currentTarget.style.boxShadow = `0 0 0 3px ${errorMsg ? 'rgba(239,68,68,0.15)' : 'rgba(173,75,126,0.12)'}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = errorMsg ? '#ef4444' : '#E5E7EB';
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
          background:
            "#FFFFFF url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 14px center",
          paddingRight: '34px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
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
          minHeight: '88px',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = errorMsg ? '#ef4444' : '#ad4b7e';
          e.currentTarget.style.boxShadow = `0 0 0 3px ${errorMsg ? 'rgba(239,68,68,0.15)' : 'rgba(173,75,126,0.12)'}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = errorMsg ? '#ef4444' : '#E5E7EB';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {hint && !errorMsg && <p style={hintStyle}>{hint}</p>}
      {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
    </div>
  );
}

const hintStyle: CSSProperties = { fontSize: '12px', color: '#6B7280', margin: 0 };
const errorStyle: CSSProperties = { fontSize: '12px', color: '#ef4444', margin: 0, fontWeight: 500 };
