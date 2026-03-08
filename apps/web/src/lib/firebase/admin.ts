/**
 * Firebase Admin（サーバー専用。ID トークン検証用）
 */
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
