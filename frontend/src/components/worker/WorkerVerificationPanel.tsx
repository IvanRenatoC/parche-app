import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Worker } from '../../types';

interface Props {
  worker: Worker;
  onClose: () => void;
}

export function WorkerVerificationPanel({ worker, onClose }: Props) {
  const hasProfilePhoto = Boolean(worker.profile_photo_url);
  const hasIdentityDoc = Boolean(worker.identity_document_url);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '20px',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ShieldCheck size={20} color="#C0395B" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Verificación visual
          </h3>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: '#FEF7E6',
            color: '#92400E',
            fontSize: '12px',
            lineHeight: 1.5,
            border: '1px solid #FCE7B0',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Parche <strong>no realiza reconocimiento facial automático</strong>. La revisión visual
          corresponde al negocio antes de aceptar al postulante.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Foto de perfil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Foto de perfil
            </span>
            {hasProfilePhoto ? (
              <img
                src={worker.profile_photo_url}
                alt="Foto de perfil"
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '10px', border: '1px solid #E8E5E0' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '10px',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9CA3AF',
                  fontSize: '12px',
                }}
              >
                Sin foto
              </div>
            )}
          </div>

          {/* Documento de identidad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Documento de identidad
            </span>
            {hasIdentityDoc ? (
              worker.identity_document_url.endsWith('.pdf') ? (
                <a
                  href={worker.identity_document_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1D4ED8',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    gap: '6px',
                  }}
                >
                  📄 Ver PDF
                </a>
              ) : (
                <img
                  src={worker.identity_document_url}
                  alt="Documento de identidad"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '10px', border: '1px solid #E8E5E0' }}
                />
              )
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '10px',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9CA3AF',
                  fontSize: '12px',
                }}
              >
                Sin documento
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        {worker.identity_review_status && (
          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                background: worker.identity_review_status === 'approved' ? '#DCFCE7' : '#FEF7E6',
                color: worker.identity_review_status === 'approved' ? '#166534' : '#92400E',
              }}
            >
              {worker.identity_review_status === 'approved'
                ? '✓ Identidad aprobada'
                : worker.identity_review_status === 'rejected'
                ? '✗ Identidad rechazada'
                : '⏳ Pendiente de revisión'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
