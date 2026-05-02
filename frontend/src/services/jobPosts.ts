import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { JobPost, Application } from '../types';
import { createNotification } from './notifications';

export interface JobPostFilters {
  region?: string;
  commune?: string;
  occupation?: string;
  start_date?: string;
}

export async function getPublishedJobPosts(filters: JobPostFilters = {}): Promise<JobPost[]> {
  // Sin orderBy en Firestore para no exigir índice compuesto status+created_at;
  // ordenamos en cliente. Funciona aunque los índices no estén desplegados.
  const constraints: QueryConstraint[] = [where('status', '==', 'published')];
  if (filters.region) constraints.push(where('region', '==', filters.region));
  if (filters.occupation) constraints.push(where('occupation', '==', filters.occupation));

  const q = query(collection(db, 'job_posts'), ...constraints);
  const snap = await getDocs(q);
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobPost));
  return posts.sort((a, b) => {
    const ta = (a.created_at as { seconds?: number } | null)?.seconds ?? 0;
    const tb = (b.created_at as { seconds?: number } | null)?.seconds ?? 0;
    return tb - ta;
  });
}

export async function getOwnerJobPosts(ownerUid: string): Promise<JobPost[]> {
  // Sin orderBy en Firestore para no exigir índice compuesto owner_uid+created_at;
  // ordenamos en cliente. Owner-side rara vez tiene muchos posts.
  const q = query(collection(db, 'job_posts'), where('owner_uid', '==', ownerUid));
  const snap = await getDocs(q);
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobPost));
  return posts.sort((a, b) => {
    const ta = (a.created_at as { seconds?: number } | null)?.seconds ?? 0;
    const tb = (b.created_at as { seconds?: number } | null)?.seconds ?? 0;
    return tb - ta;
  });
}

export async function getJobPost(id: string): Promise<JobPost | null> {
  const snap = await getDoc(doc(db, 'job_posts', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as JobPost;
}

export async function createJobPost(data: Omit<JobPost, 'id' | 'created_at' | 'updated_at' | 'accepted_workers_count'>): Promise<string> {
  const ref = await addDoc(collection(db, 'job_posts'), {
    ...data,
    accepted_workers_count: 0,
    status: 'published',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // Broadcast a los workers para que aparezca en la campanita.
  try {
    const locationLabel = [data.commune, data.region].filter(Boolean).join(', ') || 'tu zona';
    await createNotification({
      recipient_role: 'worker',
      type: 'new_job_post',
      title: 'Nuevo turno disponible',
      message: `Se publicó "${data.title}" (${data.occupation}) en ${locationLabel}.`,
      related_job_post_id: ref.id,
    });
  } catch (e) {
    // No bloquear la creación si la notificación falla.
    console.warn('No se pudo crear la notificación broadcast:', e);
  }

  return ref.id;
}

export async function updateJobPost(id: string, data: Partial<JobPost>): Promise<void> {
  await updateDoc(doc(db, 'job_posts', id), { ...data, updated_at: serverTimestamp() });
}

export async function closeJobPost(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'job_posts', id), {
    status: 'closed',
    close_reason: reason,
    updated_at: serverTimestamp(),
  });
}

export async function getJobPostApplications(jobPostId: string): Promise<Application[]> {
  const q = query(collection(db, 'applications'), where('job_post_id', '==', jobPostId));
  const snap = await getDocs(q);
  const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
  return apps.sort((a, b) => {
    const ta = (a.created_at as { seconds?: number } | null)?.seconds ?? 0;
    const tb = (b.created_at as { seconds?: number } | null)?.seconds ?? 0;
    return tb - ta;
  });
}

export async function applyToJobPost(
  post: Pick<JobPost, 'id' | 'owner_uid' | 'title' | 'occupation'>,
  workerUid: string,
  workerLabel?: string,
  applyNote?: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'applications'), {
    job_post_id: post.id,
    owner_uid: post.owner_uid,
    worker_uid: workerUid,
    status: 'applied',
    apply_note: applyNote?.trim() || null,
    withdraw_reason: null,
    rejection_reason: null,
    auto_rejection_message_sent: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  try {
    const who = workerLabel ? `${workerLabel} se postuló` : 'Recibiste una nueva postulación';
    await createNotification({
      recipient_uid: post.owner_uid,
      type: 'new_application',
      title: 'Nueva postulación',
      message: `${who} para "${post.title}" (${post.occupation}).`,
      related_job_post_id: post.id,
      related_application_id: ref.id,
    });
  } catch (e) {
    console.warn('No se pudo crear la notificación al owner:', e);
  }

  return ref.id;
}

export async function withdrawApplication(
  application: Pick<Application, 'id' | 'owner_uid' | 'job_post_id'>,
  reason: string,
  jobTitle?: string,
  workerLabel?: string
): Promise<void> {
  await updateDoc(doc(db, 'applications', application.id), {
    status: 'withdrawn',
    withdraw_reason: reason,
    updated_at: serverTimestamp(),
  });

  try {
    const who = workerLabel ?? 'Un postulante';
    const what = jobTitle ? `"${jobTitle}"` : 'tu publicación';
    await createNotification({
      recipient_uid: application.owner_uid,
      type: 'application_withdrawn',
      title: 'Un postulante desistió',
      message: `${who} desistió de ${what}${reason ? `. Motivo: ${reason}` : '.'}`,
      related_job_post_id: application.job_post_id,
      related_application_id: application.id,
    });
  } catch (e) {
    console.warn('No se pudo crear la notificación al owner:', e);
  }
}

export async function confirmParche(
  application: Pick<Application, 'id' | 'owner_uid' | 'job_post_id'>,
  jobTitle: string,
  workerLabel?: string
): Promise<void> {
  await updateDoc(doc(db, 'applications', application.id), {
    worker_confirmed_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  try {
    const who = workerLabel ? `${workerLabel} confirmó` : 'El trabajador confirmó';
    await createNotification({
      recipient_uid: application.owner_uid,
      type: 'application_accepted',
      title: 'Trabajador confirmó el turno',
      message: `${who} su participación en "${jobTitle}". Ya puede comenzar a chatear.`,
      related_job_post_id: application.job_post_id,
      related_application_id: application.id,
    });
  } catch (e) {
    console.warn('No se pudo notificar al owner del parche confirmado:', e);
  }
}

export async function getWorkerApplications(workerUid: string): Promise<Application[]> {
  const q = query(collection(db, 'applications'), where('worker_uid', '==', workerUid));
  const snap = await getDocs(q);
  const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
  return apps.sort((a, b) => {
    const ta = (a.created_at as { seconds?: number } | null)?.seconds ?? 0;
    const tb = (b.created_at as { seconds?: number } | null)?.seconds ?? 0;
    return tb - ta;
  });
}
