import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export async function uploadProfilePhoto(uid: string, file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `profile_photos/${uid}/profile_photo.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function uploadIdentityDocument(uid: string, file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `identity_documents/${uid}/identity_document.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function uploadCertificate(
  uid: string,
  certificateId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `certificates/${uid}/${certificateId}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
