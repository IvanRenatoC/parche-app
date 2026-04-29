import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { Card, Badge, Spinner } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select, Input } from '../components/ui/Input';
import {
  getPublishedJobPosts,
  getOwnerJobPosts,
  type JobPostFilters,
} from '../services/jobPosts';
import type { JobPost } from '../types';
import { OCCUPATIONS, JOB_POST_STATUS_LABEL } from '../types';
import { Plus, MapPin, Clock, Users, DollarSign, Filter, Calendar } from 'lucide-react';
import { CreateJobPostModal } from '../components/marketplace/CreateJobPostModal';
import { JobPostDetailModal } from '../components/marketplace/JobPostDetailModal';
import { CHILE_LOCATIONS, getCommunesForRegion } from '../lib/chileLocations';

export function MarketplacePage() {
  const { appUser } = useAuth();
  const isOwner = appUser?.role === 'owner';

  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobPostFilters>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!appUser) return;
    setLoading(true);
    try {
      if (isOwner) {
        const data = await getOwnerJobPosts(appUser.uid);
        setPosts(data);
      } else {
        const data = await getPublishedJobPosts(filters);
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isOwner, appUser, filters]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const occupationOptions = OCCUPATIONS.map((o) => ({ value: o, label: o }));
  const regionOptions = CHILE_LOCATIONS.map((r) => ({ value: r.name, label: r.name }));
  const communeOptions = getCommunesForRegion(filters.region).map((c) => ({ value: c, label: c }));

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>
              {isOwner ? 'Mis publicaciones' : 'Turnos disponibles'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
              {isOwner
                ? `${posts.length} publicación${posts.length !== 1 ? 'es' : ''} creada${posts.length !== 1 ? 's' : ''}`
                : `${posts.length} oportunidad${posts.length !== 1 ? 'es' : ''} disponible${posts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setShowCreate(true)} size="md">
              <Plus size={16} style={{ marginRight: '6px' }} />
              Publicar turno
            </Button>
          )}
        </div>

        {!isOwner && (
          <Card padding="sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Filter size={16} color="#ad4b7e" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F1F1F' }}>Filtros</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Select
                label="Región"
                options={regionOptions}
                placeholder="Todas las regiones"
                value={filters.region ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    region: e.target.value || undefined,
                    commune: undefined,
                  }))
                }
              />
              <Select
                label="Comuna"
                options={communeOptions}
                placeholder={filters.region ? 'Todas las comunas' : 'Elige primero una región'}
                disabled={!filters.region}
                value={filters.commune ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, commune: e.target.value || undefined }))}
              />
              <Select
                label="Oficio"
                options={occupationOptions}
                placeholder="Todos los oficios"
                value={filters.occupation ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, occupation: e.target.value || undefined }))}
              />
              <Input
                label="Fecha desde"
                type="date"
                value={filters.start_date ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value || undefined }))}
              />
            </div>
          </Card>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner size={32} />
          </div>
        ) : (
          <FilteredList
            posts={posts}
            isOwner={isOwner}
            filters={filters}
            onCreateClick={() => setShowCreate(true)}
            onSelect={setSelectedPost}
          />
        )}
      </div>

      {showCreate && (
        <CreateJobPostModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchPosts(); }}
        />
      )}

      {selectedPost && (
        <JobPostDetailModal
          post={selectedPost}
          isOwner={isOwner}
          onClose={() => setSelectedPost(null)}
          onUpdated={() => { setSelectedPost(null); fetchPosts(); }}
        />
      )}
    </Layout>
  );
}

function FilteredList({
  posts,
  isOwner,
  filters,
  onCreateClick,
  onSelect,
}: {
  posts: JobPost[];
  isOwner: boolean;
  filters: JobPostFilters;
  onCreateClick: () => void;
  onSelect: (p: JobPost) => void;
}) {
  // Apply commune filter client-side (Firestore would need composite index)
  const filtered = posts.filter((p) => {
    if (!isOwner && filters.commune && p.commune !== filters.commune) return false;
    if (!isOwner && filters.start_date && p.start_date < filters.start_date) return false;
    return true;
  });

  if (filtered.length === 0) {
    return <EmptyState isOwner={isOwner} onCreateClick={onCreateClick} />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {filtered.map((post) => (
        <JobPostCard key={post.id} post={post} isOwner={isOwner} onClick={() => onSelect(post)} />
      ))}
    </div>
  );
}

function JobPostCard({ post, isOwner, onClick }: { post: JobPost; isOwner: boolean; onClick: () => void }) {
  const statusColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
    published: 'green',
    draft: 'gray',
    closed: 'gray',
    cancelled: 'red',
    filled: 'blue',
    expired: 'amber',
  };

  return (
    <Card
      style={{ cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.05s', border: '1px solid #ECE7DD' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F1F1F', margin: 0, lineHeight: 1.3 }}>{post.title}</h3>
            <p style={{ fontSize: '13px', color: '#ad4b7e', fontWeight: 600, marginTop: '4px' }}>{post.occupation}</p>
          </div>
          <Badge color={statusColors[post.status] ?? 'gray'}>
            {JOB_POST_STATUS_LABEL[post.status]}
          </Badge>
        </div>

        {post.description && (
          <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
            {post.description.length > 90 ? post.description.slice(0, 90) + '…' : post.description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <MetaRow icon={<MapPin size={13} />}>
            {post.commune || '—'}, {post.region || '—'}
          </MetaRow>
          <MetaRow icon={<Calendar size={13} />}>{post.start_date} — {post.end_date}</MetaRow>
          <MetaRow icon={<Clock size={13} />}>{post.start_time} a {post.end_time}</MetaRow>
          <MetaRow icon={<Users size={13} />}>
            {post.accepted_workers_count} / {post.required_workers} trabajadores
          </MetaRow>
          <MetaRow icon={<DollarSign size={13} />}>
            ${post.salary_total_clp?.toLocaleString('es-CL')} CLP
          </MetaRow>
        </div>

        <div style={{ borderTop: '1px solid #ECE7DD', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '12px', color: '#ad4b7e', fontWeight: 600 }}>
            {isOwner ? 'Ver detalles y postulantes →' : 'Ver detalles y postular →'}
          </span>
        </div>
      </div>
    </Card>
  );
}

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '13px' }}>
      {icon} {children}
    </div>
  );
}

function EmptyState({ isOwner, onCreateClick }: { isOwner: boolean; onCreateClick: () => void }) {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '14px' }}>📋</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F1F1F', marginBottom: '6px' }}>
          {isOwner ? 'Aún no publicaste ningún turno' : 'No hay turnos para mostrar'}
        </h3>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
          {isOwner
            ? 'Crea tu primer turno y empieza a recibir postulantes.'
            : 'Cambia los filtros o vuelve más tarde.'}
        </p>
        {isOwner && (
          <Button onClick={onCreateClick}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Publicar turno
          </Button>
        )}
      </div>
    </Card>
  );
}
