import {
  collection,
  query,
  where,
  orderBy,
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

export interface JobPostFilters {
  region?: string;
  commune?: string;
  occupation?: string;
  start_date?: string;
}

export async function getPublishedJobPosts(filters: JobPostFilters = {}): Promise<JobPost[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    orderBy('created_at', 'desc'),
  ];
  if (filters.region) constraints.push(where('region', '==', filters.region));
  if (filters.occupation) constraints.push(where('occupation', '==', filters.occupation));

  const q = query(collection(db, 'job_posts'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobPost));
}

export async function getOwnerJobPosts(ownerUid: string): Promise<JobPost[]> {
  const q = query(
    collection(db, 'job_posts'),
    where('owner_uid', '==', ownerUid),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobPost));
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
  const q = query(
    collection(db, 'applications'),
    where('job_post_id', '==', jobPostId),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
}

export async function applyToJobPost(jobPostId: string, ownerUid: string, workerUid: string): Promise<string> {
  const ref = await addDoc(collection(db, 'applications'), {
    job_post_id: jobPostId,
    owner_uid: ownerUid,
    worker_uid: workerUid,
    status: 'applied',
    withdraw_reason: null,
    rejection_reason: null,
    auto_rejection_message_sent: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

export async function withdrawApplication(applicationId: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'applications', applicationId), {
    status: 'withdrawn',
    withdraw_reason: reason,
    updated_at: serverTimestamp(),
  });
}

export async function getWorkerApplications(workerUid: string): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('worker_uid', '==', workerUid),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
}
