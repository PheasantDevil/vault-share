/**
 * Firebase Admin（サーバー専用。ID トークン検証用）
 */
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';

function resolveAdminProjectId(): string | undefined {
  const id =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return typeof id === 'string' && id.trim() !== '' ? id.trim() : undefined;
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  const projectId = resolveAdminProjectId();
  return projectId ? initializeApp({ projectId }) : initializeApp();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
