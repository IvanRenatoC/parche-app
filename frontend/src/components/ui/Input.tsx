import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError | string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: `1.5px solid ${errorMsg ? '#ef4444' : '#e5e7eb'}`,
          fontSize: '14px',
          background: '#f9fafb',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = errorMsg ? '#ef4444' : '#ad4b7e';
          e.currentTarget.style.background = '#fff';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = errorMsg ? '#ef4444' : '#e5e7eb';
          e.currentTarget.style.background = '#f9fafb';
        }}
        className={className}
        {...props}
      />
      {hint && !errorMsg && (
        <p style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</p>
      )}
      {errorMsg && (
        <p style={{ fontSize: '12px', color: '#ef4444' }}>{errorMsg}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: FieldError | string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, hint, id, options, placeholder, className = '', ...props }: SelectProps) {
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <select
        id={id}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: `1.5px solid ${errorMsg ? '#ef4444' : '#e5e7eb'}`,
          fontSize: '14px',
          background: '#f9fafb',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
        }}
        className={className}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !errorMsg && (
        <p style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</p>
      )}
      {errorMsg && (
        <p style={{ fontSize: '12px', color: '#ef4444' }}>{errorMsg}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: FieldError | string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, className = '', ...props }: TextareaProps) {
  const errorMsg = typeof error === 'string' ? error : error?.message;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: `1.5px solid ${errorMsg ? '#ef4444' : '#e5e7eb'}`,
          fontSize: '14px',
          background: '#f9fafb',
          outline: 'none',
          resize: 'vertical',
          minHeight: '80px',
        }}
        className={className}
        {...props}
      />
      {hint && !errorMsg && (
        <p style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</p>
      )}
      {errorMsg && (
        <p style={{ fontSize: '12px', color: '#ef4444' }}>{errorMsg}</p>
      )}
    </div>
  );
}
