import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Briefcase, User as UserIcon } from 'lucide-react';
import { AuthLayout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { BUSINESS_TYPES, type BusinessType, type UserRole } from '../types';
import { CHILE_LOCATIONS, getCommunesForRegion } from '../lib/chileLocations';
import { FullscreenLoader } from '../components/ui/Loader';

const baseSchema = z.object({
  first_name: z.string().min(2, 'Nombre requerido'),
  last_name: z.string().min(2, 'Apellido requerido'),
  rut_persona: z.string().min(8, 'Ingresa tu RUT (ej: 12.345.678-9)'),
});

const ownerSchema = baseSchema.extend({
  rut_empresa: z.string().min(8, 'Ingresa el RUT del local'),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  region: z.string().optional(),
  commune: z.string().optional(),
});

const workerSchema = baseSchema.extend({
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  years_experience: z.string().optional(),
});

type OwnerFormData = z.infer<typeof ownerSchema>;
type WorkerFormData = z.infer<typeof workerSchema>;

export function OnboardingPage() {
  const { firebaseUser, appUser, loading, refreshAppUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!loading && !firebaseUser) {
      navigate('/login', { replace: true });
    }
    if (!loading && appUser?.profile_completed) {
      navigate('/marketplace', { replace: true });
    }
  }, [loading, firebaseUser, appUser, navigate]);

  if (loading || !firebaseUser) {
    return <FullscreenLoader message="Cargando…" />;
  }

  if (step === 'role' || !role) {
    return (
      <RolePicker
        onPick={(r) => {
          setRole(r);
          setStep('form');
        }}
      />
    );
  }

  if (role === 'owner') {
    return <OwnerOnboardingForm onBack={() => setStep('role')} onDone={refreshAppUser} />;
  }
  return <WorkerOnboardingForm onBack={() => setStep('role')} onDone={refreshAppUser} />;
}

function RolePicker({ onPick }: { onPick: (role: UserRole) => void }) {
  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
              ¿Cómo quieres usar Parche?
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
              Elige tu perfil para personalizar la experiencia
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <RoleCard
              icon={<Briefcase size={28} color="#C0395B" />}
              title="Soy Negocio"
              description="Tengo un local y quiero publicar turnos para encontrar trabajadores."
              onClick={() => onPick('owner')}
            />
            <RoleCard
              icon={<UserIcon size={28} color="#C0395B" />}
              title="Soy Trabajador"
              description="Busco turnos temporales en restaurantes, bares u otros locales."
              onClick={() => onPick('worker')}
            />
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            Podrás completar más datos después en tu perfil.
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}

function RoleCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        padding: '18px 20px',
        borderRadius: '14px',
        border: '1.5px solid #E8E5E0',
        background: '#FFFFFF',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#C0395B';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192, 57, 91, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E8E5E0';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
    </button>
  );
}

function OwnerOnboardingForm({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => Promise<unknown>;
}) {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { first_name: '', last_name: '', rut_persona: '', rut_empresa: '' },
  });

  const region = watch('region');

  const onSubmit: SubmitHandler<OwnerFormData> = async (data) => {
    setError('');
    if (!firebaseUser) return;
    try {
      const uid = firebaseUser.uid;
      const now = serverTimestamp();

      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email: firebaseUser.email ?? '',
          role: 'owner',
          rut: data.rut_persona,
          first_name: data.first_name,
          last_name: data.last_name,
          profile_completed: true,
          email_verified: firebaseUser.emailVerified,
          updated_at: now,
          created_at: now,
        },
        { merge: true }
      );

      await setDoc(
        doc(db, 'owners', uid),
        { uid, updated_at: now, created_at: now },
        { merge: true }
      );

      const existingBiz = await getDocs(
        query(collection(db, 'businesses'), where('owner_uid', '==', uid))
      );

      if (existingBiz.empty) {
        const bizRef = doc(collection(db, 'businesses'));
        await setDoc(bizRef, {
          owner_uid: uid,
          business_rut: data.rut_empresa,
          business_name: data.business_name || 'Mi local',
          business_type: (data.business_type as BusinessType) || 'restaurante',
          business_subtype: 'otro',
          address: '',
          place_id: '',
          lat: 0,
          lng: 0,
          region: data.region || '',
          commune: data.commune || '',
          created_at: now,
          updated_at: now,
        });
      }

      await onDone();
      navigate('/marketplace', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar tu perfil');
    }
  };

  const regionOptions = CHILE_LOCATIONS.map((r) => ({ value: r.name, label: r.name }));
  const communeOptions = getCommunesForRegion(region).map((c) => ({ value: c, label: c }));
  const typeOptions = Object.entries(BUSINESS_TYPES).map(([v, l]) => ({ value: v, label: l }));

  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '520px' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Header
            title="Cuéntanos sobre tu negocio"
            subtitle="Solo lo mínimo para empezar. Podrás completar el resto luego en tu perfil."
            onBack={onBack}
          />

          {error && <ErrorBox>{error}</ErrorBox>}

          <SectionTitle>Tus datos</SectionTitle>
          <div style={gridTwo}>
            <Input label="Nombre" placeholder="Juan" error={errors.first_name} {...register('first_name')} />
            <Input label="Apellido" placeholder="Pérez" error={errors.last_name} {...register('last_name')} />
          </div>
          <Input
            label="RUT persona"
            placeholder="12.345.678-9"
            hint="Tu RUT personal (no el del local)."
            error={errors.rut_persona}
            {...register('rut_persona')}
          />

          <SectionTitle>Tu local</SectionTitle>
          <Input
            label="RUT del local / empresa"
            placeholder="76.123.456-7"
            hint="Obligatorio para crear tu cuenta de Negocio."
            error={errors.rut_empresa}
            {...register('rut_empresa')}
          />
          <Input
            label="Nombre del local"
            placeholder="Bar Parche Test"
            hint="Opcional. Lo puedes editar después."
            {...register('business_name')}
          />
          <div style={gridTwo}>
            <Select
              label="Tipo de local"
              options={typeOptions}
              placeholder="Seleccionar (opcional)"
              {...register('business_type')}
            />
            <Select
              label="Región"
              options={regionOptions}
              placeholder="Seleccionar (opcional)"
              {...register('region')}
            />
          </div>
          <Select
            label="Comuna"
            options={communeOptions}
            placeholder={region ? 'Seleccionar comuna' : 'Elige primero una región'}
            disabled={!region}
            {...register('commune')}
          />

          <PendingHint>
            <strong>Pendientes para más adelante:</strong> dirección con Google Maps, foto del
            local, documentos y carga masiva de locales.
          </PendingHint>

          <Button type="submit" loading={isSubmitting} size="lg" fullWidth>
            Entrar a Parche
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}

function WorkerOnboardingForm({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => Promise<unknown>;
}) {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: { first_name: '', last_name: '', rut_persona: '', years_experience: '' },
  });

  const onSubmit: SubmitHandler<WorkerFormData> = async (data) => {
    setError('');
    if (!firebaseUser) return;
    try {
      const uid = firebaseUser.uid;
      const now = serverTimestamp();

      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email: firebaseUser.email ?? '',
          role: 'worker',
          rut: data.rut_persona,
          first_name: data.first_name,
          last_name: data.last_name,
          profile_completed: true,
          email_verified: firebaseUser.emailVerified,
          updated_at: now,
          created_at: now,
        },
        { merge: true }
      );

      const occupations = data.occupation
        ? [{ name: data.occupation, years_experience: Number(data.years_experience) || 0 }]
        : [];

      await setDoc(
        doc(db, 'workers', uid),
        {
          uid,
          rut: data.rut_persona,
          nationality: data.nationality || '',
          profile_photo_url: '',
          identity_document_url: '',
          occupations,
          certificates: [],
          status: 'active',
          updated_at: now,
          created_at: now,
        },
        { merge: true }
      );

      await onDone();
      navigate('/marketplace', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar tu perfil');
    }
  };

  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '520px' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Header
            title="Cuéntanos un poco de ti"
            subtitle="Solo lo mínimo para empezar a postular. Lo demás lo completas después en tu perfil."
            onBack={onBack}
          />

          {error && <ErrorBox>{error}</ErrorBox>}

          <SectionTitle>Tus datos</SectionTitle>
          <div style={gridTwo}>
            <Input label="Nombre" placeholder="María" error={errors.first_name} {...register('first_name')} />
            <Input label="Apellido" placeholder="González" error={errors.last_name} {...register('last_name')} />
          </div>
          <Input
            label="RUT persona"
            placeholder="12.345.678-9"
            error={errors.rut_persona}
            {...register('rut_persona')}
          />

          <SectionTitle>Tu trabajo (opcional)</SectionTitle>
          <Input label="Nacionalidad" placeholder="Chilena" {...register('nationality')} />
          <div style={gridTwo}>
            <Input label="Oficio principal" placeholder="Barman" {...register('occupation')} />
            <Input
              label="Años de experiencia"
              type="number"
              min="0"
              max="50"
              placeholder="3"
              {...register('years_experience')}
            />
          </div>

          <PendingHint>
            <strong>Pendientes para más adelante:</strong> foto de perfil, foto de carnet,
            certificados y más oficios. Los puedes agregar luego en tu perfil.
          </PendingHint>

          <Button type="submit" loading={isSubmitting} size="lg" fullWidth>
            Entrar a Parche
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#C0395B',
          fontSize: '13px',
          fontWeight: 500,
          padding: 0,
          marginBottom: '10px',
          cursor: 'pointer',
        }}
      >
        ← Cambiar tipo de cuenta
      </button>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '6px', lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #E8E5E0', paddingBottom: '6px' }}>
      <h3
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          margin: 0,
        }}
      >
        {children}
      </h3>
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: '8px',
        background: '#fee2e2',
        color: '#991b1b',
        fontSize: '14px',
      }}
    >
      {children}
    </div>
  );
}

function PendingHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '10px',
        background: '#FEF7E6',
        color: '#92400E',
        fontSize: '13px',
        lineHeight: 1.5,
        border: '1px solid #FCE7B0',
      }}
    >
      {children}
    </div>
  );
}

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};
