import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { createJobPost } from '../../services/jobPosts';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Input';
import { OCCUPATIONS, CHILE_REGIONS, type Business } from '../../types';
import { X } from 'lucide-react';

const schema = z.object({
  business_id: z.string().min(1, 'Selecciona un local'),
  title: z.string().min(5, 'Título muy corto'),
  occupation: z.string().min(1, 'Oficio requerido'),
  description: z.string().min(10, 'Descripción muy corta'),
  requirements: z.string().optional(),
  start_date: z.string().min(1, 'Fecha inicio requerida'),
  end_date: z.string().min(1, 'Fecha fin requerida'),
  start_time: z.string().min(1, 'Hora inicio requerida'),
  end_time: z.string().min(1, 'Hora fin requerida'),
  required_workers: z.string().min(1, 'Requerido'),
  salary_total_clp: z.string().min(1, 'Requerido'),
  region: z.string().min(1, 'Región requerida'),
  commune: z.string().min(2, 'Comuna requerida'),
});

type FormData = z.infer<typeof schema>;

export function CreateJobPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { appUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { required_workers: '1', salary_total_clp: '50000' },
  });

  useEffect(() => {
    if (!appUser) return;
    getDocs(query(collection(db, 'businesses'), where('owner_uid', '==', appUser.uid))).then(snap => {
      setBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
    });
  }, [appUser]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError('');
    try {
      await createJobPost({
        owner_uid: appUser!.uid,
        ...data,
        required_workers: Number(data.required_workers),
        salary_total_clp: Number(data.salary_total_clp),
        requirements: data.requirements ?? '',
        close_reason: null,
        status: 'published',
      });
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear publicación');
    }
  };

  const bizOptions = businesses.map(b => ({ value: b.id, label: b.business_name }));
  const occupationOptions = OCCUPATIONS.map(o => ({ value: o, label: o }));
  const regionOptions = CHILE_REGIONS.map(r => ({ value: r, label: r }));

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: 0 }}>Nueva publicación</h2>
          <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select label="Local" options={bizOptions} placeholder="Seleccionar local..." error={errors.business_id} {...register('business_id')} />
          <Input label="Título" placeholder="Ej: Barman para turno noche" error={errors.title} {...register('title')} />

          <div style={gridTwo}>
            <Select label="Oficio solicitado" options={occupationOptions} placeholder="Seleccionar..." error={errors.occupation} {...register('occupation')} />
            <Input label="Cantidad de workers" type="number" min="1" max="50" error={errors.required_workers} {...register('required_workers')} />
          </div>

          <Textarea label="Descripción" placeholder="Describe el turno, el ambiente y lo que necesitas..." error={errors.description} {...register('description')} />
          <Textarea label="Requisitos opcionales" placeholder="Ej: Experiencia mínima 2 años, uniforme oscuro..." {...register('requirements')} />

          <div style={gridTwo}>
            <Input label="Fecha inicio" type="date" error={errors.start_date} {...register('start_date')} />
            <Input label="Fecha fin" type="date" error={errors.end_date} {...register('end_date')} />
          </div>

          <div style={gridTwo}>
            <Input label="Hora inicio" type="time" error={errors.start_time} {...register('start_time')} />
            <Input label="Hora fin" type="time" error={errors.end_time} {...register('end_time')} />
          </div>

          <Input label="Salario total CLP" type="number" min="1000" placeholder="60000" error={errors.salary_total_clp} {...register('salary_total_clp')} />

          <div style={gridTwo}>
            <Select label="Región" options={regionOptions} placeholder="Seleccionar..." error={errors.region} {...register('region')} />
            <Input label="Comuna" placeholder="Providencia" error={errors.commune} {...register('commune')} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Publicar</Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

export function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
        className="fade-in"
      >
        {children}
      </div>
    </div>
  );
}

const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const closeButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#9ca3af', display: 'flex', alignItems: 'center', borderRadius: '6px', padding: '4px',
};
