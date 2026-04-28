import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { Card, Badge, Spinner } from '../components/ui/Card';
import { getOwnerJobPosts, getWorkerApplications } from '../services/jobPosts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { JobPost, Application, Business } from '../types';
import { APPLICATION_STATUS_LABEL, JOB_POST_STATUS_LABEL } from '../types';
import { User, Briefcase, DollarSign, Star, MapPin, Calendar } from 'lucide-react';

export function ProfilePage() {
  const { appUser } = useAuth();
  const isOwner = appUser?.role === 'owner';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Personal info card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#ad4b7e', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 700,
              }}
            >
              {appUser?.first_name?.[0] ?? appUser?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: 0 }}>
                {appUser?.first_name || appUser?.last_name
                  ? `${appUser.first_name} ${appUser.last_name}`
                  : 'Sin nombre'}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0' }}>{appUser?.email}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <Badge color="pink">{isOwner ? 'Owner' : 'Worker'}</Badge>
                {appUser?.profile_completed && <Badge color="green">Perfil completo</Badge>}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InfoField label="RUT" value={appUser?.rut || '—'} />
            <InfoField label="Email verificado" value={appUser?.email_verified ? 'Sí' : 'Pendiente'} />
          </div>
        </Card>

        {isOwner ? <OwnerProfile /> : <WorkerProfile />}
      </div>
    </Layout>
  );
}

function OwnerProfile() {
  const { appUser } = useAuth();
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;
    Promise.all([
      getOwnerJobPosts(appUser.uid),
      getDocs(query(collection(db, 'businesses'), where('owner_uid', '==', appUser.uid))),
    ]).then(([postsData, bizSnap]) => {
      setPosts(postsData);
      setBusinesses(bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
      setLoading(false);
    });
  }, [appUser]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>;

  const totalSpent = posts
    .filter(p => ['filled', 'closed'].includes(p.status))
    .reduce((sum, p) => sum + (p.salary_total_clp ?? 0), 0);

  const totalAccepted = posts.reduce((sum, p) => sum + p.accepted_workers_count, 0);

  const occupationStats: Record<string, number> = {};
  for (const p of posts) {
    occupationStats[p.occupation] = (occupationStats[p.occupation] ?? 0) + 1;
  }

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <StatCard icon={<Briefcase size={20} color="#ad4b7e" />} label="Publicaciones" value={String(posts.length)} />
        <StatCard icon={<User size={20} color="#22c55e" />} label="Workers aceptados" value={String(totalAccepted)} />
        <StatCard icon={<DollarSign size={20} color="#f59e0b" />} label="Total invertido" value={`$${totalSpent.toLocaleString('es-CL')}`} />
      </div>

      {/* Businesses */}
      {businesses.length > 0 && (
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>
            Locales administrados
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {businesses.map(biz => (
              <div key={biz.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: 0 }}>{biz.business_name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                    RUT: {biz.business_rut} · {biz.business_type} · {biz.business_subtype}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#9ca3af', fontSize: '12px' }}>
                    <MapPin size={11} /> {biz.commune}, {biz.region}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats by occupation */}
      {Object.keys(occupationStats).length > 0 && (
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>
            Publicaciones por oficio
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(occupationStats).map(([occupation, count]) => (
              <div key={occupation} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: '#f9fafb' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{occupation}</span>
                <Badge color="pink">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Publication history */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>
          Historial de publicaciones
        </h3>
        {posts.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
            No hay publicaciones aún
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posts.map(post => (
              <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: 0 }}>{post.title}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{post.start_date}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#ad4b7e' }}>{post.occupation}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{post.accepted_workers_count}/{post.required_workers}</span>
                  <Badge color={statusColors[post.status] ?? 'gray'}>
                    {JOB_POST_STATUS_LABEL[post.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function WorkerProfile() {
  const { appUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;
    getWorkerApplications(appUser.uid).then(apps => {
      setApplications(apps);
      setLoading(false);
    });
  }, [appUser]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>;

  const accepted = applications.filter(a => a.status === 'accepted');
  const rejected = applications.filter(a => ['rejected', 'not_selected'].includes(a.status));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <StatCard icon={<Briefcase size={20} color="#ad4b7e" />} label="Postulaciones" value={String(applications.length)} />
        <StatCard icon={<User size={20} color="#22c55e" />} label="Aceptadas" value={String(accepted.length)} />
        <StatCard icon={<Star size={20} color="#f59e0b" />} label="Rechazadas" value={String(rejected.length)} />
      </div>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>
          Historial de postulaciones
        </h3>
        {applications.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
            No has postulado aún
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {applications.map(app => (
              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', margin: 0 }}>Publicación {app.job_post_id.slice(0, 12)}...</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#9ca3af', fontSize: '12px' }}>
                    <Calendar size={11} /> {new Date(app.created_at).toLocaleDateString('es-CL')}
                  </div>
                </div>
                <Badge color={appColors[app.status] ?? 'gray'}>
                  {APPLICATION_STATUS_LABEL[app.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {icon}
        <div>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>{value}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{label}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#374151', fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}

const statusColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
  published: 'green', draft: 'gray', closed: 'gray', cancelled: 'red', filled: 'blue', expired: 'amber',
};

const appColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
  applied: 'blue', withdrawn: 'gray', accepted: 'green', rejected: 'red', not_selected: 'amber', cancelled: 'gray',
};
