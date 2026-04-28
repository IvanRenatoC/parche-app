import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthLayout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import type { UserRole } from '../types';
import { OCCUPATIONS, BUSINESS_TYPES, BUSINESS_SUBTYPES, CHILE_REGIONS, type BusinessType, type BusinessSubtype } from '../types';
import { Plus, Trash2, User, Briefcase } from 'lucide-react';

// ─── Owner schema ────────────────────────────────────────────────
const businessSchema = z.object({
  business_rut: z.string().min(3, 'RUT del local requerido'),
  business_name: z.string().min(2, 'Nombre del local requerido'),
  business_type: z.string().min(1, 'Tipo de lugar requerido'),
  business_subtype: z.string().min(1, 'Subtipo requerido'),
  address: z.string().min(5, 'Dirección requerida'),
  lat: z.string().optional(),
  lng: z.string().optional(),
  region: z.string().min(1, 'Región requerida'),
  commune: z.string().min(2, 'Comuna requerida'),
});

const ownerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rut: z.string().min(8, 'RUT inválido'),
  first_name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  businesses: z.array(businessSchema).min(1, 'Agrega al menos un local'),
});

// ─── Worker schema ───────────────────────────────────────────────
const occupationSchema = z.object({
  name: z.string().min(1, 'Oficio requerido'),
  years_experience: z.string(),
});

const workerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rut: z.string().min(8, 'RUT inválido'),
  first_name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  nationality: z.string().min(2, 'Nacionalidad requerida'),
  occupations: z.array(occupationSchema).min(1, 'Agrega al menos un oficio'),
});

type OwnerFormData = z.infer<typeof ownerSchema>;
type WorkerFormData = z.infer<typeof workerSchema>;

export function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  if (!selectedRole) return <RoleSelector onSelect={setSelectedRole} />;
  if (selectedRole === 'owner') return <OwnerForm />;
  return <WorkerForm />;
}

function RoleSelector({ onSelect }: { onSelect: (role: UserRole) => void }) {
  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111' }}>¿Cómo quieres usar Parche?</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px' }}>Elige tu perfil para continuar</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <button
              onClick={() => onSelect('owner')}
              style={roleCardStyle}
            >
              <Briefcase size={28} color="#ad4b7e" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Owner / Local</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                  Publico necesidades de personal para mi local
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect('worker')}
              style={roleCardStyle}
            >
              <User size={28} color="#ad4b7e" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Worker / Trabajador</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                  Busco turnos temporales en locales
                </div>
              </div>
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#ad4b7e', fontWeight: 600 }}>Inicia sesión</Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}

const roleCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px 20px',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.15s',
};

function OwnerForm() {
  const { signUp, refreshAppUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      businesses: [{ business_rut: '', business_name: '', business_type: '', business_subtype: '', address: '', region: '', commune: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'businesses' });

  const onSubmit: SubmitHandler<OwnerFormData> = async (data) => {
    setError('');
    try {
      await signUp(data.email, data.password, 'owner');
      const { auth } = await import('../lib/firebase');
      const uid = auth.currentUser!.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        email: data.email,
        role: 'owner',
        rut: data.rut,
        first_name: data.first_name,
        last_name: data.last_name,
        profile_completed: true,
        email_verified: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      await setDoc(doc(db, 'owners', uid), {
        uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      for (const biz of data.businesses) {
        const bizRef = doc(db, 'businesses', `${uid}_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        await setDoc(bizRef, {
          owner_uid: uid,
          business_rut: biz.business_rut,
          business_name: biz.business_name,
          business_type: biz.business_type as BusinessType,
          business_subtype: biz.business_subtype as BusinessSubtype,
          address: biz.address,
          place_id: '',
          lat: parseFloat(biz.lat ?? '0') || 0,
          lng: parseFloat(biz.lng ?? '0') || 0,
          region: biz.region,
          commune: biz.commune,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      await refreshAppUser();
      navigate('/marketplace');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error en el registro');
    }
  };

  const businessTypeOptions = Object.entries(BUSINESS_TYPES).map(([v, l]) => ({ value: v, label: l }));
  const businessSubtypeOptions = Object.entries(BUSINESS_SUBTYPES).map(([v, l]) => ({ value: v, label: l }));
  const regionOptions = CHILE_REGIONS.map(r => ({ value: r, label: r }));

  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '560px', marginTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>Registro — Owner</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Información personal y de tu local</p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionTitle>Datos personales</SectionTitle>
            <div style={gridTwo}>
              <Input label="RUT persona" placeholder="12.345.678-9" error={errors.rut} {...register('rut')} />
              <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email} {...register('email')} />
            </div>
            <div style={gridTwo}>
              <Input label="Nombre" placeholder="Juan" error={errors.first_name} {...register('first_name')} />
              <Input label="Apellido" placeholder="Pérez" error={errors.last_name} {...register('last_name')} />
            </div>
            <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" error={errors.password} {...register('password')} />

            <SectionTitle>Locales</SectionTitle>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                style={{ padding: '16px', borderRadius: '10px', background: '#f2f3f5', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>Local {idx + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
                <div style={gridTwo}>
                  <Input label="RUT del local" placeholder="76.123.456-7" error={errors.businesses?.[idx]?.business_rut} {...register(`businesses.${idx}.business_rut`)} />
                  <Input label="Nombre del local" placeholder="El Rinconcito" error={errors.businesses?.[idx]?.business_name} {...register(`businesses.${idx}.business_name`)} />
                </div>
                <div style={gridTwo}>
                  <Select label="Tipo de lugar" options={businessTypeOptions} placeholder="Seleccionar..." error={errors.businesses?.[idx]?.business_type} {...register(`businesses.${idx}.business_type`)} />
                  <Select label="Subtipo" options={businessSubtypeOptions} placeholder="Seleccionar..." error={errors.businesses?.[idx]?.business_subtype} {...register(`businesses.${idx}.business_subtype`)} />
                </div>
                <Input
                  label="Dirección"
                  placeholder="Av. Providencia 1234, Providencia"
                  hint="Ingresa la dirección completa. Integración Maps disponible próximamente."
                  error={errors.businesses?.[idx]?.address}
                  {...register(`businesses.${idx}.address`)}
                />
                <div style={gridTwo}>
                  <Input label="Latitud (opcional)" placeholder="-33.4372" {...register(`businesses.${idx}.lat`)} />
                  <Input label="Longitud (opcional)" placeholder="-70.6506" {...register(`businesses.${idx}.lng`)} />
                </div>
                <div style={gridTwo}>
                  <Select label="Región" options={regionOptions} placeholder="Seleccionar..." error={errors.businesses?.[idx]?.region} {...register(`businesses.${idx}.region`)} />
                  <Input label="Comuna" placeholder="Providencia" error={errors.businesses?.[idx]?.commune} {...register(`businesses.${idx}.commune`)} />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ business_rut: '', business_name: '', business_type: '', business_subtype: '', address: '', region: '', commune: '' })}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ad4b7e', background: 'none', border: '1.5px dashed #ad4b7e', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              <Plus size={16} /> Agregar otro local
            </button>

            <Button type="submit" loading={isSubmitting} fullWidth size="lg">
              Crear cuenta
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#ad4b7e', fontWeight: 600 }}>Inicia sesión</Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}

function WorkerForm() {
  const { signUp, refreshAppUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      occupations: [{ name: '', years_experience: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'occupations' });

  const occupationOptions = OCCUPATIONS.map(o => ({ value: o, label: o }));

  const onSubmit: SubmitHandler<WorkerFormData> = async (data) => {
    setError('');
    try {
      await signUp(data.email, data.password, 'worker');
      const { auth } = await import('../lib/firebase');
      const uid = auth.currentUser!.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        email: data.email,
        role: 'worker',
        rut: data.rut,
        first_name: data.first_name,
        last_name: data.last_name,
        profile_completed: true,
        email_verified: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      await setDoc(doc(db, 'workers', uid), {
        uid,
        rut: data.rut,
        nationality: data.nationality,
        profile_photo_url: '',
        identity_document_url: '',
        occupations: data.occupations.map(o => ({ name: o.name, years_experience: Number(o.years_experience) })),
        certificates: [],
        status: 'active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      await refreshAppUser();
      navigate('/marketplace');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error en el registro');
    }
  };

  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '520px', marginTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>Registro — Worker</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Tu perfil profesional</p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionTitle>Datos personales</SectionTitle>
            <div style={gridTwo}>
              <Input label="RUT" placeholder="12.345.678-9" error={errors.rut} {...register('rut')} />
              <Input label="Nacionalidad" placeholder="Chilena" error={errors.nationality} {...register('nationality')} />
            </div>
            <div style={gridTwo}>
              <Input label="Nombre" placeholder="María" error={errors.first_name} {...register('first_name')} />
              <Input label="Apellido" placeholder="González" error={errors.last_name} {...register('last_name')} />
            </div>
            <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email} {...register('email')} />
            <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" error={errors.password} {...register('password')} />

            <SectionTitle>Oficios</SectionTitle>

            {fields.map((field, idx) => (
              <div key={field.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <Select
                    label="Oficio"
                    options={occupationOptions}
                    placeholder="Seleccionar..."
                    error={errors.occupations?.[idx]?.name}
                    {...register(`occupations.${idx}.name`)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Años exp."
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    error={errors.occupations?.[idx]?.years_experience}
                    {...register(`occupations.${idx}.years_experience`)}
                  />
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px 8px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ name: '', years_experience: '0' })}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ad4b7e', background: 'none', border: '1.5px dashed #ad4b7e', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              <Plus size={16} /> Agregar otro oficio
            </button>

            <SectionTitle>Foto de perfil</SectionTitle>
            <div
              style={{
                padding: '20px',
                borderRadius: '10px',
                background: '#f2f3f5',
                textAlign: 'center',
                border: '2px dashed #d1d5db',
              }}
            >
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Foto desde el cuello hacia arriba
              </p>
              <p style={{ fontSize: '13px', color: '#ad4b7e', fontWeight: 500 }}>
                Te aconsejamos tomarte esta foto con seriedad. Puede marcar la diferencia.
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Subida de archivos disponible próximamente (Storage configurado)
              </p>
            </div>

            <Button type="submit" loading={isSubmitting} fullWidth size="lg">
              Crear cuenta
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#ad4b7e', fontWeight: 600 }}>Inicia sesión</Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '2px solid #f2f3f5', paddingBottom: '6px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ad4b7e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {children}
      </h3>
    </div>
  );
}

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};
