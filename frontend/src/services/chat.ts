import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Chat, ChatMessage } from '../types';

export async function getOrCreateChat(
  ownerUid: string,
  workerUid: string,
  jobPostId: string,
  applicationId: string
): Promise<string> {
  const q = query(
    collection(db, 'chats'),
    where('application_id', '==', applicationId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  const ref = await addDoc(collection(db, 'chats'), {
    owner_uid: ownerUid,
    worker_uid: workerUid,
    job_post_id: jobPostId,
    application_id: applicationId,
    last_message: null,
    last_message_at: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

export async function findChatByApplication(applicationId: string): Promise<Chat | null> {
  const q = query(
    collection(db, 'chats'),
    where('application_id', '==', applicationId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Chat;
}

export async function sendMessage(
  chatId: string,
  senderUid: string,
  content: string
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    sender_uid: senderUid,
    content: trimmed,
    created_at: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', chatId), {
    last_message: trimmed.slice(0, 100),
    last_message_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('created_at', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        chat_id: chatId,
        ...d.data(),
      } as ChatMessage))
    );
  });
}
