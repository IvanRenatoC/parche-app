import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { Card, Badge, Spinner } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Application, Business, JobPost, Worker } from '../types';
import { APPLICATION_STATUS_LABEL, BUSINESS_TYPES, type BusinessType, JOB_POST_STATUS_LABEL } from '../types';
import { Briefcase, DollarSign, MapPin, User as UserIcon, Edit3, Save, X, Calendar, Plus } from 'lucide-react';
import { CHILE_LOCATIONS, getCommunesForRegion } from '../lib/chileLocations';
import { getOwnerJobPosts, getWorkerApplications } from '../services/jobPosts';
import { AddressAutocomplete, EMPTY_ADDRESS, type AddressValue } from '../components/ui/AddressAutocomplete';

export function ProfilePage() {
  const { appUser } = useAuth();
  const isOwner = appUser?.role === 'owner';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px', margin: '0 auto' }}>
        <PersonalCard />
        {isOwner ? <OwnerSection /> : <WorkerSection />}
      </div>
    </Layout>
  );
}

function PersonalCard() {
  const { appUser, refreshAppUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [first_name, setFirstName] = useState(appUser?.first_name ?? '');
  const [last_name, setLastName] = useState(appUser?.last_name ?? '');
  const [rut, setRut] = useState(appUser?.rut ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFirstName(appUser?.first_name ?? '');
    setLastName(appUser?.last_name ?? '');
    setRut(appUser?.rut ?? '');
  }, [appUser]);

  if (!appUser) return null;
  const roleLabel = appUser.role === 'owner' ? 'Negocio' : 'Trabajador';

  async function handleSave() {
    if (!appUser) return;
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        first_name,
        last_name,
        rut,
        updated_at: serverTimestamp(),
      });
      await refreshAppUser();
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#C0395B', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#FFFFFF', fontSize: '24px', fontWeight: 700,
            }}
          >
            {appUser.first_name?.[0]?.toUpperCase() ?? appUser.email[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {appUser.first_name || appUser.last_name
                ? `${appUser.first_name} ${appUser.last_name}`
                : 'Sin nombre'}
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '2px 0 0' }}>{appUser.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Badge color="pink">{roleLabel}</Badge>
              {appUser.profile_completed && <Badge color="green">Datos básicos completos</Badge>}
            </div>
          </div>
        </div>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Edit3 size={14} style={{ marginRight: '6px' }} /> Editar
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setError(''); }}>
              <X size={14} style={{ marginRight: '6px' }} /> Cancelar
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave}>
              <Save size={14} style={{ marginRight: '6px' }} /> Guardar
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {editing ? (
          <>
            <Input label="Nombre" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Apellido" value={last_name} onChange={(e) => setLastName(e.target.value)} />
            <Input label="RUT persona" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="12.345.678-9" />
          </>
        ) : (
          <>
            <InfoField label="Nombre" value={appUser.first_name || '—'} />
            <InfoField label="Apellido" value={appUser.last_name || '—'} />
            <InfoField label="RUT persona" value={appUser.rut || '—'} />
            <InfoField label="Email verificado" value={appUser.email_verified ? 'Sí' : 'Pendiente'} />
          </>
        )}
      </div>
    </Card>
  );
}

function OwnerSection() {
  const { appUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const reload = useCallback(async () => {
    if (!appUser) return;
    setLoading(true);
    const [bizSnap, postsData] = await Promise.all([
      getDocs(query(collection(db, 'businesses'), where('owner_uid', '==', appUser.uid))),
      getOwnerJobPosts(appUser.uid),
    ]);
    setBusinesses(bizSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Business)));
    setPosts(postsData);
    setLoading(false);
  }, [appUser]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '24px' }}><Spinner /></div>
      </Card>
    );
  }

  const totalSpent = posts
    .filter((p) => ['filled', 'closed'].includes(p.status))
    .reduce((sum, p) => sum + (p.salary_total_clp ?? 0), 0);
  const totalAccepted = posts.reduce((sum, p) => sum + (p.accepted_workers_count ?? 0), 0);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <StatCard icon={<Briefcase size={20} color="#C0395B" />} label="Publicaciones" value={String(posts.length)} />
        <StatCard icon={<UserIcon size={20} color="#22C55E" />} label="Trabajadores aceptados" value={String(totalAccepted)} />
        <StatCard icon={<DollarSign size={20} color="#F59E0B" />} label="Total invertido" value={`$${totalSpent.toLocaleString('es-CL')}`} />
      </div>

      <Card>
        <SectionHeader
          title="Mis locales"
          subtitle="Tus locales registrados. Puedes editar sus datos básicos o agregar otro."
          right={
            !creatingNew && (
              <Button size="sm" onClick={() => setCreatingNew(true)}>
                <Plus size={14} style={{ marginRight: '6px' }} /> Agregar local
              </Button>
            )
          }
        />
        {creatingNew && appUser && (
          <div style={{ marginTop: '14px' }}>
            <NewBusinessForm
              ownerUid={appUser.uid}
              onCancel={() => setCreatingNew(false)}
              onCreated={async () => { setCreatingNew(false); await reload(); }}
            />
          </div>
        )}
        {businesses.length === 0 && !creatingNew ? (
          <p style={{ fontSize: '14px', color: '#9CA3AF', padding: '12px 0' }}>
            No tienes locales registrados. Usa "Agregar local" para crear el primero.
          </p>
        ) : businesses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: creatingNew ? '14px' : 0 }}>
            {businesses.map((biz) => (
              <BusinessRow
                key={biz.id}
                business={biz}
                isEditing={editingId === biz.id}
                onEdit={() => setEditingId(biz.id)}
                onCancel={() => setEditingId(null)}
                onSaved={async () => { setEditingId(null); await reload(); }}
              />
            ))}
          </div>
        ) : null}
      </Card>

      <Card>
        <SectionHeader title="Historial de publicaciones" subtitle={`${posts.length} publicaciones creadas`} />
        {posts.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9CA3AF', padding: '12px 0' }}>
            Aún no creaste publicaciones.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posts.map((post) => (
              <div key={post.id} style={historyRow}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{post.title}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{post.start_date}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#C0395B' }}>{post.occupation}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{post.accepted_workers_count}/{post.required_workers}</span>
                  <Badge color={statusColors[post.status] ?? 'gray'}>
                    {JOB_POST_STATUS_LABEL[post.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PendingCard
        items={[
          'Foto de carnet o pasaporte de la persona',
          'Foto del local',
          'Documentos del local',
          'Calificaciones recibidas',
        ]}
      />
    </>
  );
}

function NewBusinessForm({
  ownerUid,
  onCancel,
  onCreated,
}: {
  ownerUid: string;
  onCancel: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [type, setType] = useState<string>('restaurante');
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const regionOptions = CHILE_LOCATIONS.map((r) => ({ value: r.name, label: r.name }));
  const communeOptions = getCommunesForRegion(region).map((c) => ({ value: c, label: c }));
  const typeOptions = Object.entries(BUSINESS_TYPES).map(([v, l]) => ({ value: v, label: l }));

  async function save() {
    setError('');
    if (!name.trim()) {
      setError('Ingresa el nombre del local');
      return;
    }
    if (!rut.trim() || rut.trim().length < 8) {
      setError('Ingresa el RUT del local (ej: 76.123.456-7)');
      return;
    }
    setSaving(true);
    try {
      const now = serverTimestamp();
      await addDoc(collection(db, 'businesses'), {
        owner_uid: ownerUid,
        business_rut: rut,
        business_name: name,
        business_type: type as BusinessType,
        business_subtype: 'otro',
        address: address.address,
        place_id: address.place_id,
        lat: address.lat,
        lng: address.lng,
        region,
        commune,
        created_at: now,
        updated_at: now,
      });
      await onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el local');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...businessRowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
        Nuevo local — completa los datos básicos. La dirección con Google Maps es opcional pero
        recomendada.
      </p>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <Input label="Nombre del local" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bar Parche Centro" />
        <Input label="RUT del local" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="76.123.456-7" />
        <Select label="Tipo de local" options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} />
        <Select
          label="Región"
          options={regionOptions}
          placeholder="Seleccionar"
          value={region}
          onChange={(e) => { setRegion(e.target.value); setCommune(''); }}
        />
        <Select
          label="Comuna"
          options={communeOptions}
          placeholder={region ? 'Seleccionar' : 'Elige primero una región'}
          disabled={!region}
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
        />
      </div>
      <AddressAutocomplete
        value={address}
        onChange={setAddress}
        label="Dirección exacta del local"
        hint="Selecciona una sugerencia para fijar la ubicación en el mapa."
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
          <X size={13} style={{ marginRight: '6px' }} /> Cancelar
        </Button>
        <Button size="sm" loading={saving} onClick={save}>
          <Save size={13} style={{ marginRight: '6px' }} /> Crear local
        </Button>
      </div>
    </div>
  );
}

function BusinessRow({
  business,
  isEditing,
  onEdit,
  onCancel,
  onSaved,
}: {
  business: Business;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(business.business_name);
  const [rut, setRut] = useState(business.business_rut);
  const [type, setType] = useState<string>(business.business_type);
  const [region, setRegion] = useState(business.region);
  const [commune, setCommune] = useState(business.commune);
  const [address, setAddress] = useState<AddressValue>({
    address: business.address ?? '',
    place_id: business.place_id ?? '',
    lat: business.lat ?? 0,
    lng: business.lng ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      setName(business.business_name);
      setRut(business.business_rut);
      setType(business.business_type);
      setRegion(business.region);
      setCommune(business.commune);
      setAddress({
        address: business.address ?? '',
        place_id: business.place_id ?? '',
        lat: business.lat ?? 0,
        lng: business.lng ?? 0,
      });
      setError('');
    }
  }, [isEditing, business]);

  const regionOptions = CHILE_LOCATIONS.map((r) => ({ value: r.name, label: r.name }));
  const communeOptions = getCommunesForRegion(region).map((c) => ({ value: c, label: c }));
  const typeOptions = Object.entries(BUSINESS_TYPES).map(([v, l]) => ({ value: v, label: l }));

  async function save() {
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'businesses', business.id), {
        business_name: name,
        business_rut: rut,
        business_type: type as BusinessType,
        region,
        commune,
        address: address.address,
        place_id: address.place_id,
        lat: address.lat,
        lng: address.lng,
        updated_at: serverTimestamp(),
      });
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div style={businessRowStyle}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{business.business_name}</p>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
            RUT {business.business_rut} · {BUSINESS_TYPES[business.business_type] ?? business.business_type}
          </p>
          {(business.region || business.commune) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#9CA3AF', fontSize: '12px' }}>
              <MapPin size={11} /> {business.commune || '—'}, {business.region || '—'}
            </div>
          )}
          {business.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#6B7280', fontSize: '12px' }}>
              <MapPin size={11} color="#C0395B" /> {business.address}
            </div>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          <Edit3 size={13} style={{ marginRight: '6px' }} /> Editar
        </Button>
      </div>
    );
  }

  return (
    <div style={{ ...businessRowStyle, flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <Input label="Nombre del local" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="RUT del local" value={rut} onChange={(e) => setRut(e.target.value)} />
        <Select label="Tipo de local" options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} />
        <Select
          label="Región"
          options={regionOptions}
          placeholder="Seleccionar"
          value={region}
          onChange={(e) => { setRegion(e.target.value); setCommune(''); }}
        />
        <Select
          label="Comuna"
          options={communeOptions}
          placeholder={region ? 'Seleccionar' : 'Elige primero una región'}
          disabled={!region}
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
        />
      </div>
      <AddressAutocomplete
        value={address}
        onChange={setAddress}
        label="Dirección exacta del local"
        hint="Selecciona una sugerencia para fijar la ubicación en el mapa."
      />
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" loading={saving} onClick={save}>Guardar</Button>
      </div>
    </div>
  );
}

function WorkerSection() {
  const { appUser } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [nationality, setNationality] = useState('');
  const [occupation, setOccupation] = useState('');
  const [years, setYears] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!appUser) return;
    setLoading(true);
    const [workerSnap, apps] = await Promise.all([
      getDoc(doc(db, 'workers', appUser.uid)),
      getWorkerApplications(appUser.uid),
    ]);
    if (workerSnap.exists()) {
      const w = workerSnap.data() as Worker;
      setWorker(w);
      setNationality(w.nationality ?? '');
      const first = w.occupations?.[0];
      setOccupation(first?.name ?? '');
      setYears(String(first?.years_experience ?? 0));
    } else {
      setWorker(null);
    }
    setApplications(apps);
    setLoading(false);
  }, [appUser]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '24px' }}><Spinner /></div>
      </Card>
    );
  }

  const accepted = applications.filter((a) => a.status === 'accepted');
  const rejected = applications.filter((a) => ['rejected', 'not_selected'].includes(a.status));

  async function save() {
    if (!appUser) return;
    setSaving(true);
    setError('');
    try {
      const occupations = occupation
        ? [{ name: occupation, years_experience: Number(years) || 0 }]
        : [];
      await setDoc(
        doc(db, 'workers', appUser.uid),
        {
          uid: appUser.uid,
          rut: appUser.rut,
          nationality,
          occupations,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
      await reload();
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <StatCard icon={<Briefcase size={20} color="#C0395B" />} label="Postulaciones" value={String(applications.length)} />
        <StatCard icon={<UserIcon size={20} color="#22C55E" />} label="Aceptadas" value={String(accepted.length)} />
        <StatCard icon={<UserIcon size={20} color="#F59E0B" />} label="No seleccionadas" value={String(rejected.length)} />
      </div>

      <Card>
        <SectionHeader
          title="Mi trabajo"
          subtitle="Estos datos ayudan a que los Negocios te encuentren más rápido."
          right={
            !editing ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit3 size={13} style={{ marginRight: '6px' }} /> Editar
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setError(''); }}>Cancelar</Button>
                <Button size="sm" loading={saving} onClick={save}>Guardar</Button>
              </div>
            )
          }
        />
        {error && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {editing ? (
            <>
              <Input label="Nacionalidad" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Chilena" />
              <Input label="Oficio principal" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Barman" />
              <Input label="Años de experiencia" type="number" min="0" value={years} onChange={(e) => setYears(e.target.value)} />
            </>
          ) : (
            <>
              <InfoField label="Nacionalidad" value={worker?.nationality || '—'} />
              <InfoField
                label="Oficio principal"
                value={worker?.occupations?.[0]?.name || '—'}
              />
              <InfoField
                label="Años de experiencia"
                value={
                  worker?.occupations?.[0]?.years_experience !== undefined
                    ? `${worker.occupations[0].years_experience} años`
                    : '—'
                }
              />
              <InfoField label="Estado" value={worker?.status === 'active' ? 'Activo' : 'Suspendido'} />
            </>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Historial de postulaciones" subtitle={`${applications.length} postulaciones`} />
        {applications.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9CA3AF', padding: '12px 0' }}>
            Aún no postulaste a ningún turno.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {applications.map((app) => (
              <div key={app.id} style={historyRow}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>
                    Publicación {app.job_post_id.slice(0, 10)}…
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#9CA3AF', fontSize: '12px' }}>
                    <Calendar size={11} />
                    {app.created_at ? new Date(app.created_at).toLocaleDateString('es-CL') : '—'}
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

      <PendingCard
        items={[
          'Foto de carnet o pasaporte',
          'Foto de perfil (cuello hacia arriba)',
          'Certificados de cursos',
          'Calificaciones recibidas',
          'Más oficios y experiencia detallada',
        ]}
      />
    </>
  );
}

function PendingCard({ items }: { items: string[] }) {
  return (
    <Card style={{ background: '#FEF7E6', border: '1px solid #FCE7B0' }}>
      <SectionHeader
        title="Pendientes para completar después"
        subtitle="Estos campos no son obligatorios ahora, pero ayudan a tu perfil."
      />
      <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#92400E', fontSize: '13px', lineHeight: 1.7 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {icon}
        <div>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>{label}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', color: '#111827', fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

const businessRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '12px',
  background: '#F7F4EF',
  border: '1px solid #ECE7DD',
};

const historyRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderRadius: '10px',
  background: '#F7F4EF',
  border: '1px solid #ECE7DD',
};

const statusColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
  published: 'green', draft: 'gray', closed: 'gray', cancelled: 'red', filled: 'blue', expired: 'amber',
};

const appColors: Record<string, 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'pink'> = {
  applied: 'blue', withdrawn: 'gray', accepted: 'green', rejected: 'red', not_selected: 'amber', cancelled: 'gray',
};
