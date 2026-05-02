import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rating, UserRole, Application, JobPost, User } from '../types';

export interface PendingRating {
  application_id: string;
  job_post_id: string;
  job_title: string;
  other_uid: string;
  other_name: string;
  other_role: UserRole;
}

export async function createRating(
  fromUid: string,
  toUid: string,
  fromRole: UserRole,
  jobPostId: string,
  score: number,
  comment?: string
): Promise<void> {
  await addDoc(collection(db, 'ratings'), {
    from_uid: fromUid,
    to_uid: toUid,
    from_role: fromRole,
    job_post_id: jobPostId,
    score,
    comment: comment?.trim() ?? '',
    created_at: serverTimestamp(),
  });
}

export async function getUserAverageRating(
  uid: string
): Promise<{ average: number; count: number }> {
  const q = query(collection(db, 'ratings'), where('to_uid', '==', uid));
  const snap = await getDocs(q);
  if (snap.empty) return { average: 0, count: 0 };
  const scores = snap.docs.map((d) => (d.data() as Rating).score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { average: Math.round(average * 10) / 10, count: scores.length };
}

async function resolveOtherName(uid: string, fallbackRole: UserRole): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const u = snap.data() as User;
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
      if (name) return name;
    }
  } catch { /* ignore */ }
  return `${fallbackRole === 'worker' ? 'Trabajador' : 'Negocio'} ${uid.slice(0, 6)}…`;
}

export async function getPendingRatings(
  uid: string,
  role: UserRole
): Promise<PendingRating[]> {
  const today = new Date().toISOString().slice(0, 10);

  // Accepted applications for this user (single-field query — no composite index needed)
  const field = role === 'owner' ? 'owner_uid' : 'worker_uid';
  const appsSnap = await getDocs(
    query(collection(db, 'applications'), where(field, '==', uid))
  );

  // Filter accepted client-side to avoid composite index
  const acceptedApps = appsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Application))
    .filter((a) => a.status === 'accepted');

  if (acceptedApps.length === 0) return [];

  // Ratings already submitted by this user
  const ratingsSnap = await getDocs(
    query(collection(db, 'ratings'), where('from_uid', '==', uid))
  );
  const ratedJobPostIds = new Set(
    ratingsSnap.docs.map((d) => (d.data() as Rating).job_post_id)
  );

  const pending: PendingRating[] = [];

  for (const app of acceptedApps) {
    if (ratedJobPostIds.has(app.job_post_id)) continue;

    try {
      const jobSnap = await getDoc(doc(db, 'job_posts', app.job_post_id));
      if (!jobSnap.exists()) continue;
      const jobPost = { id: jobSnap.id, ...jobSnap.data() } as JobPost;

      // Only require rating once the job has ended
      if (jobPost.end_date >= today) continue;

      const otherUid = role === 'owner' ? app.worker_uid : app.owner_uid;
      const otherRole: UserRole = role === 'owner' ? 'worker' : 'owner';
      const otherName = await resolveOtherName(otherUid, otherRole);

      pending.push({
        application_id: app.id,
        job_post_id: app.job_post_id,
        job_title: jobPost.title,
        other_uid: otherUid,
        other_name: otherName,
        other_role: otherRole,
      });
    } catch { /* skip if job post unreadable */ }
  }

  return pending;
}
