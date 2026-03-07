/**
 * Pulumi GCP infrastructure for Vault Share.
 * Firestore, Secret Manager, Identity Platform (enable via console or separate stack).
 */

import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const project =
  config.get('gcp:project') ||
  process.env.GOOGLE_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  config.require('gcp:project');

// Firestore (Native mode) - use default database
// Note: Firestore is often created once via console; this ensures the API is enabled.
const firestore = new gcp.projects.Service('firestore', {
  service: 'firestore.googleapis.com',
  project,
});

// Secret Manager for encryption keys
const secretManager = new gcp.projects.Service('secretmanager', {
  service: 'secretmanager.googleapis.com',
  project,
});

// Optional: placeholder secret for item encryption key (actual value set outside Pulumi)
const encryptionKeySecret = new gcp.secretmanager.Secret(
  'item-encryption-key',
  {
    secretId: 'vault-share-item-encryption-key',
    replication: { auto: {} },
    project,
  },
  { dependsOn: [secretManager] }
);

// Identity Platform - enable API (actual IdP config often done in console)
const identityPlatform = new gcp.projects.Service('identityplatform', {
  service: 'identitytoolkit.googleapis.com',
  project,
});

export const projectId = project;
export const encryptionKeySecretName = encryptionKeySecret.name;
