import { useRef } from 'react';
import { CheckCircle, AlertCircle, Camera, IdCard } from 'lucide-react';

export interface UploadedFile {
  file: File;
  preview: string;
}

interface UploadSlotProps {
  label: string;
  hint: string;
  icon: React.ReactNode;
  accept: string;
  value: UploadedFile | null;
  onChange: (v: UploadedFile | null) => void;
  error?: string;
}

function UploadSlot({ label, hint, icon, accept, value, onChange, error }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ file, preview });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
        {label} <span style={{ color: '#C0395B' }}>*</span>
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${error ? '#DC2626' : value ? '#22C55E' : '#D1D5DB'}`,
          borderRadius: '12px',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: value ? '#F0FDF4' : '#FAFAFA',
          transition: 'all 0.15s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {value ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {value.file.type.startsWith('image/') ? (
              <img
                src={value.preview}
                alt="preview"
                style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ fontSize: '32px' }}>📄</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} color="#22C55E" />
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                {value.file.name}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Click para cambiar</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#9CA3AF' }}>{icon}</div>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
              Click para subir o tomar foto
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{hint}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}

interface Props {
  profilePhoto: UploadedFile | null;
  identityDocument: UploadedFile | null;
  onProfilePhotoChange: (v: UploadedFile | null) => void;
  onIdentityDocumentChange: (v: UploadedFile | null) => void;
  errors?: { profilePhoto?: string; identityDocument?: string };
  required?: boolean;
  onSkip?: () => void;
}

export function IdentityUpload({
  profilePhoto,
  identityDocument,
  onProfilePhotoChange,
  onIdentityDocumentChange,
  errors,
  required = true,
  onSkip,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: '#EFF6FF',
          color: '#1D4ED8',
          fontSize: '13px',
          lineHeight: 1.5,
          border: '1px solid #BFDBFE',
        }}
      >
        <strong>¿Para qué sirven estas fotos?</strong>
        <br />
        El negocio las revisará visualmente antes de aceptarte. Parche <strong>no</strong> usa
        reconocimiento facial automático. La comparación es visual y la realiza el negocio.
      </div>

      <UploadSlot
        label="Foto de perfil"
        hint="JPG o PNG · máx 5 MB"
        icon={<Camera size={28} />}
        accept="image/*"
        value={profilePhoto}
        onChange={onProfilePhotoChange}
        error={errors?.profilePhoto}
      />

      <UploadSlot
        label="Foto de carnet o documento de identidad"
        hint="JPG, PNG o PDF · máx 10 MB"
        icon={<IdCard size={28} />}
        accept="image/*,application/pdf"
        value={identityDocument}
        onChange={onIdentityDocumentChange}
        error={errors?.identityDocument}
      />

      {!required && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            alignSelf: 'center',
          }}
        >
          Saltar por ahora (podrás subirlas desde tu perfil)
        </button>
      )}
    </div>
  );
}
