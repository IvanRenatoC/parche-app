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
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {isOwner ? 'Mis publicaciones' : 'Turnos disponibles'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              {isOwner
                ? `${posts.length} ${posts.length === 1 ? 'publicación creada' : 'publicaciones creadas'}`
                : `${posts.length} ${posts.length === 1 ? 'oportunidad disponible' : 'oportunidades disponibles'}`}
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus size={14} style={{ marginRight: '6px' }} />
              Publicar turno
            </Button>
          )}
        </div>

        {!isOwner && (
          <Card padding="sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Filter size={16} color="#C0395B" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Filtros</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {filtered.map((post) => (
        <JobPostRow key={post.id} post={post} isOwner={isOwner} onClick={() => onSelect(post)} />
      ))}
    </div>
  );
}

function JobPostRow({ post, isOwner, onClick }: { post: JobPost; isOwner: boolean; onClick: () => void }) {
  const statusColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
    published: 'green',
    draft: 'gray',
    closed: 'gray',
    cancelled: 'red',
    filled: 'blue',
    expired: 'amber',
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        background: '#FFFFFF',
        border: '1px solid #E8E5E0',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#C0395B';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#E8E5E0';
      }}
    >
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.title}
          </h3>
          <Badge color={statusColors[post.status] ?? 'gray'}>{JOB_POST_STATUS_LABEL[post.status]}</Badge>
        </div>
        <p style={{ fontSize: '12px', color: '#C0395B', fontWeight: 600, marginTop: '3px' }}>
          {post.occupation}
        </p>
      </div>

      <RowMeta icon={<MapPin size={13} />}>{post.commune || '—'}</RowMeta>
      <RowMeta icon={<Calendar size={13} />}>
        {post.start_date}
        {post.end_date && post.end_date !== post.start_date ? ` → ${post.end_date}` : ''}
      </RowMeta>
      <RowMeta icon={<Clock size={13} />}>
        {post.start_time}–{post.end_time}
      </RowMeta>
      <RowMeta icon={<Users size={13} />}>
        {post.accepted_workers_count}/{post.required_workers}
      </RowMeta>
      <RowMeta icon={<DollarSign size={13} />} bold>
        ${post.salary_total_clp?.toLocaleString('es-CL')}
      </RowMeta>

      <div style={{ flexShrink: 0, fontSize: '12px', color: '#C0395B', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {isOwner ? 'Ver postulantes →' : 'Postular →'}
      </div>
    </div>
  );
}

function RowMeta({
  icon,
  children,
  bold = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: bold ? '#111827' : '#6B7280',
        fontSize: '12.5px',
        fontWeight: bold ? 600 : 500,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </div>
  );
}

function EmptyState({ isOwner, onCreateClick }: { isOwner: boolean; onCreateClick: () => void }) {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '32px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
          {isOwner ? 'Aún no publicaste ningún turno' : 'No hay turnos para mostrar'}
        </h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
          {isOwner
            ? 'Crea tu primer turno y empieza a recibir postulantes.'
            : 'Cambia los filtros o vuelve más tarde.'}
        </p>
        {isOwner && (
          <Button onClick={onCreateClick} size="sm">
            <Plus size={14} style={{ marginRight: '6px' }} /> Publicar turno
          </Button>
        )}
      </div>
    </Card>
  );
}
