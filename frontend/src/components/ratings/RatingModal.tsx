import { useState } from 'react';
import { createRating } from '../../services/ratings';
import type { PendingRating } from '../../services/ratings';
import type { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { ModalOverlay } from '../marketplace/CreateJobPostModal';
import { Star } from 'lucide-react';

interface Props {
  pending: PendingRating;
  fromUid: string;
  fromRole: UserRole;
  /** Called after the rating is submitted successfully */
  onSubmitted: () => void;
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  const labels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          >
            <Star
              size={32}
              fill={n <= active ? '#F59E0B' : 'none'}
              color={n <= active ? '#F59E0B' : '#D1D5DB'}
              style={{ transition: 'color 0.1s, fill 0.1s' }}
            />
          </button>
        ))}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', height: '18px' }}>
        {active > 0 ? labels[active] : 'Selecciona una puntuación'}
      </span>
    </div>
  );
}

export function RatingModal({ pending, fromUid, fromRole, onSubmitted }: Props) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (score === 0) { setError('Por favor selecciona una puntuación.'); return; }
    setLoading(true);
    setError('');
    try {
      await createRating(fromUid, pending.other_uid, fromRole, pending.job_post_id, score, comment);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar la calificación.');
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = pending.other_role === 'worker' ? 'trabajador' : 'negocio';

  return (
    <ModalOverlay onClose={() => { /* no cierre sin calificar — el botón cancelar no existe intencionalmente */ }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⭐</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Califica a {pending.other_name}
          </h3>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>
            Turno: <strong>{pending.job_title}</strong>
            <br />
            Antes de continuar, evalúa a este {roleLabel}.
          </p>
        </div>

        {/* Stars */}
        <StarSelector value={score} onChange={setScore} />

        {/* Comment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
            Comentario <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Cómo fue la experiencia?"
            rows={3}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1.5px solid #E8E5E0',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.4,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C0395B'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E5E0'; }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <Button fullWidth loading={loading} onClick={handleSubmit} size="lg">
          Enviar calificación
        </Button>
      </div>
    </ModalOverlay>
  );
}
