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
import { OCCUPATIONS, CHILE_REGIONS, JOB_POST_STATUS_LABEL } from '../types';
import { Plus, MapPin, Clock, Users, DollarSign, Filter, Calendar } from 'lucide-react';
import { CreateJobPostModal } from '../components/marketplace/CreateJobPostModal';
import { JobPostDetailModal } from '../components/marketplace/JobPostDetailModal';

export function MarketplacePage() {
  const { appUser } = useAuth();
  const isOwner = appUser?.role === 'owner';

  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobPostFilters>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (isOwner) {
        const data = await getOwnerJobPosts(appUser!.uid);
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

  const occupationOptions = OCCUPATIONS.map(o => ({ value: o, label: o }));
  const regionOptions = CHILE_REGIONS.map(r => ({ value: r, label: r }));

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: 0 }}>
              {isOwner ? 'Mis publicaciones' : 'Publicaciones disponibles'}
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              {isOwner
                ? `${posts.length} publicación${posts.length !== 1 ? 'es' : ''} creada${posts.length !== 1 ? 's' : ''}`
                : `${posts.length} oportunidad${posts.length !== 1 ? 'es' : ''} disponible${posts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setShowCreate(true)} size="md">
              <Plus size={16} style={{ marginRight: '6px' }} />
              Nueva publicación
            </Button>
          )}
        </div>

        {/* Filters (worker only) */}
        {!isOwner && (
          <Card padding="sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Filter size={16} color="#ad4b7e" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Filtros</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <Select
                label="Región"
                options={regionOptions}
                placeholder="Todas"
                value={filters.region ?? ''}
                onChange={e => setFilters(f => ({ ...f, region: e.target.value || undefined }))}
              />
              <Input
                label="Comuna"
                placeholder="Ej: Providencia"
                value={filters.commune ?? ''}
                onChange={e => setFilters(f => ({ ...f, commune: e.target.value || undefined }))}
              />
              <Select
                label="Oficio"
                options={occupationOptions}
                placeholder="Todos"
                value={filters.occupation ?? ''}
                onChange={e => setFilters(f => ({ ...f, occupation: e.target.value || undefined }))}
              />
              <Input
                label="Fecha inicio"
                type="date"
                value={filters.start_date ?? ''}
                onChange={e => setFilters(f => ({ ...f, start_date: e.target.value || undefined }))}
              />
            </div>
          </Card>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner size={32} />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState isOwner={isOwner} onCreateClick={() => setShowCreate(true)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {posts.map(post => (
              <JobPostCard
                key={post.id}
                post={post}
                isOwner={isOwner}
                onClick={() => setSelectedPost(post)}
              />
            ))}
          </div>
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
      style={{ cursor: 'pointer', transition: 'box-shadow 0.15s', border: '1px solid transparent' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        (e.currentTarget as HTMLDivElement).style.border = '1px solid #f0f0f0';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLDivElement).style.border = '1px solid transparent';
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.3 }}>{post.title}</h3>
            <p style={{ fontSize: '13px', color: '#ad4b7e', fontWeight: 500, marginTop: '2px' }}>{post.occupation}</p>
          </div>
          <Badge color={statusColors[post.status] ?? 'gray'}>
            {JOB_POST_STATUS_LABEL[post.status]}
          </Badge>
        </div>

        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
          {post.description?.length > 80 ? post.description.slice(0, 80) + '…' : post.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <MetaRow icon={<MapPin size={13} />}>{post.commune}, {post.region}</MetaRow>
          <MetaRow icon={<Calendar size={13} />}>{post.start_date} — {post.end_date}</MetaRow>
          <MetaRow icon={<Clock size={13} />}>{post.start_time} a {post.end_time}</MetaRow>
          <MetaRow icon={<Users size={13} />}>
            {post.accepted_workers_count} / {post.required_workers} workers
          </MetaRow>
          <MetaRow icon={<DollarSign size={13} />}>
            ${post.salary_total_clp?.toLocaleString('es-CL')} CLP
          </MetaRow>
        </div>

        {isOwner && (
          <div style={{ borderTop: '1px solid #f2f3f5', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Ver detalles y postulantes →</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '13px' }}>
      {icon} {children}
    </div>
  );
}

function EmptyState({ isOwner, onCreateClick }: { isOwner: boolean; onCreateClick: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
        {isOwner ? 'Aún no tienes publicaciones' : 'No hay publicaciones disponibles'}
      </h3>
      <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
        {isOwner ? 'Crea tu primera publicación para encontrar workers.' : 'Intenta con otros filtros o revisa más tarde.'}
      </p>
      {isOwner && (
        <Button onClick={onCreateClick}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Crear publicación
        </Button>
      )}
    </div>
  );
}
