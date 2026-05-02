import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

const schema = z.object({ email: z.string().email('Email inválido') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch {
      setError('No se pudo enviar el correo. Verifica el email ingresado.');
    }
  }

  return (
    <AuthLayout>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>Correo enviado</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <Link to="/login" style={{ display: 'block', marginTop: '16px', color: '#C0395B', fontWeight: 600, fontSize: '14px' }}>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>Recuperar contraseña</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  Te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input id="email" label="Email" type="email" placeholder="tu@email.com" error={errors.email} {...register('email')} />
                <Button type="submit" loading={isSubmitting} fullWidth>Enviar enlace</Button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                <Link to="/login" style={{ color: '#C0395B' }}>Volver al inicio de sesión</Link>
              </p>
            </>
          )}
        </div>
      </Card>
    </AuthLayout>
  );
}
