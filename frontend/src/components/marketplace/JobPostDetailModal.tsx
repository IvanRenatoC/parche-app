import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  getJobPostApplications,
  withdrawApplication,
  applyToJobPost,
  closeJobPost,
} from '../../services/jobPosts';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Card';
import { Textarea } from '../ui/Input';
import { ModalOverlay } from './CreateJobPostModal';
import type { JobPost, Application, User as AppUser, Worker } from '../../types';
import { APPLICATION_STATUS_LABEL, JOB_POST_STATUS_LABEL } from '../../types';
import {
  MapPin, Calendar, Clock, Users, DollarSign, Briefcase,
  CheckCircle, XCircle, Check, X
} from 'lucide-react';

type EnrichedApplication = Application & { worker?: Worker & { user?: AppUser } };

interface Props {
  post: JobPost;
  isOwner: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function JobPostDetailModal({ post, isOwner, onClose, onUpdated }: Props) {
  const { appUser } = useAuth();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const enrich = useCallback(async (apps: Application[]): Promise<EnrichedApplication[]> => {
    return Promise.all(
      apps.map(async (app) => {
        try {
          const [userSnap, workerSnap] = await Promise.all([
            getDoc(doc(db, 'users', app.worker_uid)),
            getDoc(doc(db, 'workers', app.worker_uid)),
          ]);
          const user = userSnap.exists() ? (userSnap.data() as AppUser) : undefined;
          const worker = workerSnap.exists() ? (workerSnap.data() as Worker) : undefined;
          return { ...app, worker: worker ? { ...worker, user } : (user ? ({ uid: app.worker_uid, user } as Worker & { user: AppUser }) : undefined) };
        } catch {
          return app;
        }
      })
    );
  }, []);

  const loadApplications = useCallback(async () => {
    if (isOwner) {
      setLoadingApps(true);
      try {
        const apps = await getJobPostApplications(post.id);
        const enriched = await enrich(apps);
        setApplications(enriched);
      } catch (e) {
        console.error('No se pudieron cargar postulantes:', e);
      } finally {
        setLoadingApps(false);
      }
    } else if (appUser) {
      // Worker: query only own application (allowed by rules)
      const q = query(
        collection(db, 'applications'),
        where('job_post_id', '==', post.id),
        where('worker_uid', '==', appUser.uid)
      );
      const snap = await getDocs(q);
      const mine = snap.docs[0]
        ? ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Application)
        : null;
      setMyApplication(mine);
    }
  }, [appUser, isOwner, post.id, enrich]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  async function handleApply() {
    if (!appUser) return;
    setActionLoading('apply');
    setError('');
    try {
      await applyToJobPost(post.id, post.owner_uid, appUser.uid);
      setInfo('¡Postulación enviada! El Negocio recibirá tu interés.');
      await loadApplications();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al postular');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleWithdraw() {
    if (!myApplication) return;
    setActionLoading('withdraw');
    try {
      await withdrawApplication(myApplication.id, withdrawReason);
      setInfo('Retiraste tu postulación.');
      setShowWithdraw(false);
      await loadApplications();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al retirar postulación');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleClose() {
    setActionLoading('close');
    try {
      await closeJobPost(post.id, closeReason);
      onUpdated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al bajar publicación');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAcceptWorker(application: Application) {
    setActionLoading(`accept_${application.id}`);
    setError('');
    setInfo('');
    try {
      await api.post(`/applications/${application.id}/accept`, {});
      setInfo('Aceptaste al trabajador. Notificamos a los demás postulantes.');
      await loadApplications();
      onUpdated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al aceptar postulante';
      setError(`${msg}. Verifica que el backend esté corriendo en :8000.`);
    } finally {
      setActionLoading(null);
    }
  }

  const statusColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
    published: 'green', draft: 'gray', closed: 'gray', cancelled: 'red', filled: 'blue', expired: 'amber',
  };
  const appColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
    applied: 'blue', withdrawn: 'gray', accepted: 'green', rejected: 'red', not_selected: 'amber', cancelled: 'gray',
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Badge color={statusColors[post.status] ?? 'gray'}>{JOB_POST_STATUS_LABEL[post.status]}</Badge>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1F1F1F', margin: '8px 0 4px' }}>{post.title}</h2>
            <p style={{ fontSize: '14px', color: '#ad4b7e', fontWeight: 600, margin: 0 }}>{post.occupation}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#dcfce7', color: '#166534', fontSize: '14px' }}>
            {info}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <MetaItem icon={<MapPin size={14} />} label="Ubicación">{post.commune}, {post.region}</MetaItem>
          <MetaItem icon={<Calendar size={14} />} label="Fecha">{post.start_date} — {post.end_date}</MetaItem>
          <MetaItem icon={<Clock size={14} />} label="Horario">{post.start_time} a {post.end_time}</MetaItem>
          <MetaItem icon={<DollarSign size={14} />} label="Salario">${post.salary_total_clp?.toLocaleString('es-CL')} CLP</MetaItem>
          <MetaItem icon={<Users size={14} />} label="Trabajadores">
            {post.accepted_workers_count} / {post.required_workers} cubiertos
          </MetaItem>
          <MetaItem icon={<Briefcase size={14} />} label="Oficio">{post.occupation}</MetaItem>
        </div>

        {post.description && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Descripción
            </h4>
            <p style={{ fontSize: '14px', color: '#1F1F1F', lineHeight: 1.6 }}>{post.description}</p>
          </div>
        )}

        {post.requirements && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Requisitos
            </h4>
            <p style={{ fontSize: '14px', color: '#1F1F1F', lineHeight: 1.6 }}>{post.requirements}</p>
          </div>
        )}

        {!isOwner && post.status === 'published' && (
          <div style={{ borderTop: '1px solid #ECE7DD', paddingTop: '16px' }}>
            {!myApplication ? (
              <Button fullWidth onClick={handleApply} loading={actionLoading === 'apply'} size="lg">
                Postular a este turno
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge color={appColors[myApplication.status] ?? 'gray'}>
                    {APPLICATION_STATUS_LABEL[myApplication.status]}
                  </Badge>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Tu postulación</span>
                </div>
                {myApplication.status === 'applied' && !showWithdraw && (
                  <Button variant="outline" size="sm" onClick={() => setShowWithdraw(true)}>
                    Retirar postulación
                  </Button>
                )}
                {showWithdraw && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Textarea
                      label="Motivo del retiro"
                      placeholder="¿Por qué retiras tu postulación?"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" size="sm" onClick={() => setShowWithdraw(false)}>Cancelar</Button>
                      <Button variant="danger" size="sm" loading={actionLoading === 'withdraw'} onClick={handleWithdraw}>
                        Confirmar retiro
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div style={{ borderTop: '1px solid #ECE7DD', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {post.status === 'published' && !showClose && (
                <Button variant="outline" size="sm" onClick={() => setShowClose(true)}>
                  Bajar publicación
                </Button>
              )}
            </div>

            {showClose && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Textarea label="Motivo" placeholder="¿Por qué bajas la publicación?" value={closeReason} onChange={(e) => setCloseReason(e.target.value)} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowClose(false)}>Cancelar</Button>
                  <Button variant="danger" size="sm" loading={actionLoading === 'close'} onClick={handleClose}>Confirmar</Button>
                </div>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F1F1F', marginBottom: '12px' }}>
                Postulantes ({applications.filter((a) => a.status === 'applied').length} activos)
              </h4>
              {loadingApps ? (
                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Cargando postulantes…</p>
              ) : applications.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Aún no hay postulantes.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {applications.map((app) => (
                    <ApplicationRow
                      key={app.id}
                      application={app}
                      canAccept={post.status === 'published' && app.status === 'applied' && post.accepted_workers_count < post.required_workers}
                      onAccept={() => handleAcceptWorker(app)}
                      loading={actionLoading === `accept_${app.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

function ApplicationRow({
  application,
  canAccept,
  onAccept,
  loading,
}: {
  application: EnrichedApplication;
  canAccept: boolean;
  onAccept: () => void;
  loading: boolean;
}) {
  const statusIcon: Record<string, React.ReactNode> = {
    accepted: <CheckCircle size={14} color="#22C55E" />,
    rejected: <XCircle size={14} color="#ef4444" />,
    not_selected: <XCircle size={14} color="#F59E0B" />,
  };
  const appColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
    applied: 'blue', withdrawn: 'gray', accepted: 'green', rejected: 'red', not_selected: 'amber', cancelled: 'gray',
  };

  const u = application.worker?.user;
  const displayName = u
    ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email
    : `Trabajador ${application.worker_uid.slice(0, 6)}…`;
  const initials = (u?.first_name?.[0] ?? u?.email?.[0] ?? 'T').toUpperCase();
  const occupation = application.worker?.occupations?.[0];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: '12px', background: '#F7F4EF', border: '1px solid #ECE7DD',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', background: '#ad4b7e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#FFFFFF',
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F1F1F', margin: 0 }}>{displayName}</p>
          {occupation && (
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
              {occupation.name} · {occupation.years_experience} años
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {statusIcon[application.status]}
            <Badge color={appColors[application.status] ?? 'gray'}>
              {APPLICATION_STATUS_LABEL[application.status]}
            </Badge>
          </div>
        </div>
      </div>
      {canAccept && (
        <Button size="sm" variant="primary" loading={loading} onClick={onAccept}>
          <Check size={14} style={{ marginRight: '4px' }} /> Aceptar
        </Button>
      )}
    </div>
  );
}

function MetaItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9CA3AF', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon} {label}
      </div>
      <span style={{ fontSize: '14px', color: '#1F1F1F', fontWeight: 500 }}>{children}</span>
    </div>
  );
}
