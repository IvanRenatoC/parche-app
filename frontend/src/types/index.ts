export type UserRole = 'owner' | 'worker';

export type JobPostStatus = 'draft' | 'published' | 'closed' | 'cancelled' | 'filled' | 'expired';

export type ApplicationStatus =
  | 'applied'
  | 'withdrawn'
  | 'accepted'
  | 'rejected'
  | 'not_selected'
  | 'cancelled';

export type NotificationType =
  | 'application_not_selected'
  | 'application_accepted'
  | 'application_rejected'
  | 'application_withdrawn'
  | 'job_post_filled'
  | 'new_application'
  | 'new_job_post'
  | 'general';

export type BusinessType =
  | 'restaurante'
  | 'bar'
  | 'restobar'
  | 'disco'
  | 'tienda'
  | 'convenience_store'
  | 'otro';

export type BusinessSubtype =
  | 'comida_china'
  | 'thai'
  | 'chilena'
  | 'peruana'
  | 'sushi'
  | 'seafood'
  | 'rapida'
  | 'otro';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  rut: string;
  first_name: string;
  last_name: string;
  profile_completed: boolean;
  email_verified: boolean;
  data_processing_consent_accepted?: boolean;
  data_processing_consent_accepted_at?: string;
  data_processing_consent_version?: string;
  created_at: string;
  updated_at: string;
}

export interface Occupation {
  name: string;
  years_experience: number;
}

export interface Certificate {
  name: string;
  url: string;
}

export type IdentityReviewStatus = 'pending_owner_review' | 'approved' | 'rejected';

export interface Worker {
  uid: string;
  rut: string;
  nationality: string;
  profile_photo_url: string;
  profile_photo_path?: string;
  identity_document_url: string;
  identity_document_path?: string;
  identity_review_status?: IdentityReviewStatus;
  identity_uploaded_at?: string;
  profile_photo_uploaded_at?: string;
  occupations: Occupation[];
  certificates: Certificate[];
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_uid: string;
  business_rut: string;
  business_name: string;
  business_type: BusinessType;
  business_subtype: BusinessSubtype;
  address: string;
  place_id: string;
  lat: number;
  lng: number;
  region: string;
  commune: string;
  created_at: string;
  updated_at: string;
}

export interface JobPost {
  id: string;
  owner_uid: string;
  business_id: string;
  title: string;
  occupation: string;
  description: string;
  requirements: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  required_workers: number;
  accepted_workers_count: number;
  salary_total_clp: number;
  region: string;
  commune: string;
  status: JobPostStatus;
  close_reason: string | null;
  /** Denormalized from Business so workers can render the post without
   * needing read access to the businesses collection. */
  business_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  business?: Business;
}

export interface Application {
  id: string;
  job_post_id: string;
  owner_uid: string;
  worker_uid: string;
  status: ApplicationStatus;
  apply_note?: string | null;
  withdraw_reason: string | null;
  rejection_reason: string | null;
  auto_rejection_message_sent: boolean;
  worker_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
  worker?: Worker & { user?: User };
}

export interface Chat {
  id: string;
  owner_uid: string;
  worker_uid: string;
  job_post_id: string;
  application_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_uid: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  job_post_id: string;
  author_uid: string;
  author_role: UserRole;
  author_name: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  from_uid: string;
  to_uid: string;
  from_role: UserRole;
  job_post_id: string;
  score: number;
  comment: string;
  created_at: string;
}

export interface Notification {
  id: string;
  /** Direct notification target. Empty string for role-based broadcasts. */
  recipient_uid: string;
  /** Role-based broadcast target. Empty string for direct notifications. */
  recipient_role: UserRole | '';
  type: NotificationType;
  title: string;
  message: string;
  related_job_post_id: string | null;
  related_application_id: string | null;
  /** True for direct notifications when recipient has read it. */
  read: boolean;
  /** UIDs of users that have read this broadcast notification. */
  read_by: string[];
  created_at: string;
}

export const OCCUPATIONS = [
  'Maestro de cocina',
  'Ayudante de cocina',
  'Barman',
  'Copero',
  'Mesero',
  'DJ',
  'Aseador',
  'Garzón',
  'Cajero',
  'Anfitrión',
  'Guardia',
  'Otro',
] as const;

export const BUSINESS_TYPES: Record<BusinessType, string> = {
  restaurante: 'Restaurante',
  bar: 'Bar',
  restobar: 'Restobar',
  disco: 'Discoteca',
  tienda: 'Tienda',
  convenience_store: 'Convenience Store',
  otro: 'Otro',
};

export const BUSINESS_SUBTYPES: Record<BusinessSubtype, string> = {
  comida_china: 'Comida China',
  thai: 'Comida Thai',
  chilena: 'Comida Chilena',
  peruana: 'Comida Peruana',
  sushi: 'Sushi',
  seafood: 'Mariscos / Seafood',
  rapida: 'Comida Rápida',
  otro: 'Otro',
};

export const CHILE_REGIONS = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana',
  'Región del Libertador General Bernardo O\'Higgins',
  'Región del Maule',
  'Región de Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén',
  'Región de Magallanes y de la Antártica Chilena',
] as const;

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: 'Postulado',
  withdrawn: 'Retirado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  not_selected: 'No seleccionado',
  cancelled: 'Cancelado',
};

export const JOB_POST_STATUS_LABEL: Record<JobPostStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
  filled: 'Cupos completos',
  expired: 'Expirado',
};
