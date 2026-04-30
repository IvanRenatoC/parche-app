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
import { OCCUPATIONS, type Business } from '../../types';
import { CHILE_LOCATIONS, getCommunesForRegion } from '../../lib/chileLocations';
import { X } from 'lucide-react';

const schema = z.object({
  business_id: z.string().min(1, 'Selecciona un local'),
  title: z.string().min(5, 'Título muy corto'),
  occupation: z.string().min(1, 'Oficio requerido'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  start_date: z.string().min(1, 'Fecha inicio requerida'),
  end_date: z.string().min(1, 'Fecha fin requerida'),
  start_time: z.string().min(1, 'Hora inicio requerida'),
  end_time: z.string().min(1, 'Hora fin requerida'),
  required_workers: z.string().min(1, 'Requerido'),
  salary_total_clp: z.string().min(1, 'Requerido'),
  region: z.string().min(1, 'Región requerida'),
  commune: z.string().min(1, 'Comuna requerida'),
});

type FormData = z.infer<typeof schema>;

export function CreateJobPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { appUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      required_workers: '1',
      salary_total_clp: '50000',
      start_date: '',
      end_date: '',
    },
  });

  const region = watch('region');

  useEffect(() => {
    if (!appUser) return;
    getDocs(query(collection(db, 'businesses'), where('owner_uid', '==', appUser.uid))).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Business));
      setBusinesses(list);
      // If user has only one business, prefill it (and prefill region/commune from it)
      if (list.length === 1) {
        const b = list[0];
        setValue('business_id', b.id);
        if (b.region) setValue('region', b.region);
        if (b.commune) setValue('commune', b.commune);
      }
    });
  }, [appUser, setValue]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError('');
    try {
      // Default end_date to start_date if blank
      const end_date = data.end_date || data.start_date;
      await createJobPost({
        owner_uid: appUser!.uid,
        business_id: data.business_id,
        title: data.title,
        occupation: data.occupation,
        description: data.description ?? '',
        requirements: data.requirements ?? '',
        start_date: data.start_date,
        end_date,
        start_time: data.start_time,
        end_time: data.end_time,
        required_workers: Number(data.required_workers),
        salary_total_clp: Number(data.salary_total_clp),
        region: data.region,
        commune: data.commune,
        close_reason: null,
        status: 'published',
      });
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear publicación');
    }
  };

  const bizOptions = businesses.map((b) => ({ value: b.id, label: b.business_name || `Local ${b.id.slice(0, 6)}` }));
  const occupationOptions = OCCUPATIONS.map((o) => ({ value: o, label: o }));
  const regionOptions = CHILE_LOCATIONS.map((r) => ({ value: r.name, label: r.name }));
  const communeOptions = getCommunesForRegion(region).map((c) => ({ value: c, label: c }));

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>Publicar turno</h2>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Cerrar"><X size={18} /></button>
        </div>

        {businesses.length === 0 && (
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#FEF7E6', color: '#92400E', fontSize: '12px', border: '1px solid #FCE7B0' }}>
            Necesitas un local registrado. Ve a tu perfil para verificar tus locales.
          </div>
        )}

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          <Select label="Local" options={bizOptions} placeholder="Seleccionar local…" error={errors.business_id} {...register('business_id')} />
          <Input label="Título" placeholder="Ej: Barman para turno noche" error={errors.title} {...register('title')} />

          <div style={gridTwo}>
            <Select label="Oficio solicitado" options={occupationOptions} placeholder="Seleccionar…" error={errors.occupation} {...register('occupation')} />
            <Input label="N° de trabajadores" type="number" min="1" max="50" error={errors.required_workers} {...register('required_workers')} />
          </div>

          <Textarea label="Descripción (opcional)" placeholder="Cuéntanos del turno, el ambiente y lo que necesitas…" {...register('description')} />
          <Textarea label="Requisitos (opcional)" placeholder="Ej: experiencia mínima 2 años, traer uniforme oscuro" {...register('requirements')} />

          <div style={gridTwo}>
            <Input label="Fecha inicio" type="date" error={errors.start_date} {...register('start_date')} />
            <Input label="Fecha fin (opcional)" type="date" hint="Si es por un día, déjalo vacío." {...register('end_date')} />
          </div>

          <div style={gridTwo}>
            <Input label="Hora inicio" type="time" error={errors.start_time} {...register('start_time')} />
            <Input label="Hora término" type="time" error={errors.end_time} {...register('end_time')} />
          </div>

          <Input label="Salario total CLP" type="number" min="1000" placeholder="60000" error={errors.salary_total_clp} {...register('salary_total_clp')} />

          <div style={gridTwo}>
            <Select label="Región" options={regionOptions} placeholder="Seleccionar…" error={errors.region} {...register('region')} />
            <Select
              label="Comuna"
              options={communeOptions}
              placeholder={region ? 'Seleccionar comuna' : 'Elige primero una región'}
              disabled={!region}
              error={errors.commune}
              {...register('commune')}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" loading={isSubmitting} disabled={businesses.length === 0}>
              Publicar
            </Button>
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
        background: 'rgba(31,31,31,0.45)',
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
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '18px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
      >
        {children}
      </div>
    </div>
  );
}

const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#9CA3AF',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '6px',
  padding: '4px',
};
