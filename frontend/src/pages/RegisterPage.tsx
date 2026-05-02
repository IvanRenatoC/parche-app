import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';

const schema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError('');
    try {
      await signUp(data.email, data.password);
      navigate('/onboarding', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error en el registro');
    }
  };

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/onboarding', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error con Google');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>Crea tu cuenta</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
              Solo necesitamos tu email y una contraseña. Después completarás tus datos.
            </p>
          </div>

          {error && (
            <div style={errorBoxStyle}>{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email}
              autoComplete="email"
              {...register('email')}
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              error={errors.password}
              autoComplete="new-password"
              {...register('password')}
            />
            <Input
              id="confirm"
              label="Repite tu contraseña"
              type="password"
              placeholder="Confirma tu contraseña"
              error={errors.confirm}
              autoComplete="new-password"
              {...register('confirm')}
            />

            <Button type="submit" loading={isSubmitting} fullWidth size="lg">
              Crear cuenta
            </Button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          </div>

          <Button
            type="button"
            variant="secondary"
            loading={googleLoading}
            fullWidth
            onClick={handleGoogle}
          >
            <GoogleIcon /> &nbsp;Continuar con Google
          </Button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#C0395B', fontWeight: 600 }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}

const errorBoxStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  background: '#fee2e2',
  color: '#991b1b',
  fontSize: '14px',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
