import { useState, useEffect } from 'react';
import { getUserAverageRating } from '../../services/ratings';
import { Star } from 'lucide-react';

interface Props {
  uid: string;
  size?: 'sm' | 'md';
}

export function StarDisplay({ uid, size = 'sm' }: Props) {
  const [data, setData] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    getUserAverageRating(uid).then(setData);
  }, [uid]);

  if (!data) return null;

  const starSize = size === 'sm' ? 12 : 15;
  const fontSize = size === 'sm' ? '11px' : '13px';

  if (data.count === 0) {
    return (
      <span style={{ fontSize, color: '#9CA3AF', fontStyle: 'italic' }}>
        Sin calificaciones
      </span>
    );
  }

  const filled = Math.round(data.average);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={starSize}
          fill={n <= filled ? '#F59E0B' : 'none'}
          color={n <= filled ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
      <span style={{ fontSize, color: '#6B7280', marginLeft: '2px' }}>
        {data.average.toFixed(1)} ({data.count})
      </span>
    </span>
  );
}
