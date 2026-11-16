import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import bundledAppletConfig from '../../firebase-applet-config.json';

interface FirebaseRuntimeConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: Array<{
      providerId?: string | null;
      email?: string | null;
    }>;
  };
}

function readEnvString(key: string): string {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
  const val = env ? env[key] : undefined;
  return typeof val === 'string' ? val.trim() : '';
}

function resolveFirebaseConfig(): FirebaseRuntimeConfig {
  const envApiKey = readEnvString('VITE_FIREBASE_API_KEY');
  const envAuthDomain = readEnvString('VITE_FIREBASE_AUTH_DOMAIN');
  const envProjectId = readEnvString('VITE_FIREBASE_PROJECT_ID');
  const envStorageBucket = readEnvString('VITE_FIREBASE_STORAGE_BUCKET');
  const envMessagingSenderId = readEnvString('VITE_FIREBASE_MESSAGING_SENDER_ID');
  const envAppId = readEnvString('VITE_FIREBASE_APP_ID');
  const envDatabaseId = readEnvString('VITE_FIREBASE_FIRESTORE_DATABASE_ID');

  const hasEnvOverrides = Boolean(envApiKey || envProjectId || envAppId);

  if (hasEnvOverrides) {
    return {
      apiKey: envApiKey,
      authDomain: envAuthDomain,
      projectId: envProjectId,
      storageBucket: envStorageBucket,
      messagingSenderId: envMessagingSenderId,
      appId: envAppId,
      firestoreDatabaseId: envDatabaseId || undefined,
    };
  }

  return {
    apiKey: bundledAppletConfig.apiKey || '',
    authDomain: bundledAppletConfig.authDomain || '',
    projectId: bundledAppletConfig.projectId || '',
    storageBucket: bundledAppletConfig.storageBucket || '',
    messagingSenderId: bundledAppletConfig.messagingSenderId || '',
    appId: bundledAppletConfig.appId || '',
    firestoreDatabaseId: bundledAppletConfig.firestoreDatabaseId || undefined,
  };
}

const resolvedConfig = resolveFirebaseConfig();

const missingFields: string[] = [];
if (!resolvedConfig.apiKey) missingFields.push('VITE_FIREBASE_API_KEY');
if (!resolvedConfig.authDomain) missingFields.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!resolvedConfig.projectId) missingFields.push('VITE_FIREBASE_PROJECT_ID');
if (!resolvedConfig.appId) missingFields.push('VITE_FIREBASE_APP_ID');

export const isFirebaseConfigured = missingFields.length === 0;
export const firebaseConfigError: string | null = isFirebaseConfigured
  ? null
  : `Firebase configuration is incomplete. Missing: ${missingFields.join(', ')}.`;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initError: string | null = firebaseConfigError;

if (isFirebaseConfigured) {
  try {
    appInstance =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: resolvedConfig.apiKey,
            authDomain: resolvedConfig.authDomain,
            projectId: resolvedConfig.projectId,
            storageBucket: resolvedConfig.storageBucket,
            messagingSenderId: resolvedConfig.messagingSenderId,
            appId: resolvedConfig.appId,
          });

    authInstance = getAuth(appInstance);
    setPersistence(authInstance, browserLocalPersistence).catch((err) => {
      console.warn('Could not enable local auth persistence:', err);
    });

    dbInstance = resolvedConfig.firestoreDatabaseId
      ? getFirestore(appInstance, resolvedConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
  } catch (err) {
    initError =
      err instanceof Error
        ? `Firebase initialization failed: ${err.message}`
        : 'Firebase initialization failed.';
    console.error(initError);
  }
}

export const firebaseApp = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const activeFirebaseError = initError;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function requireFirestore(): Firestore {
  if (!db) {
    throw new Error(
      activeFirebaseError ||
        'Cloud Firestore is not configured. Please check your Firebase environment variables.'
    );
  }
  return db;
}

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error(
      activeFirebaseError ||
        'Firebase Authentication is not configured. Please check your Firebase environment variables.'
    );
  }
  return auth;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser ?? null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function extractReadableError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const raw = error.message || '';
  if (raw.startsWith('{') && raw.includes('"operationType"')) {
    try {
      const parsed = JSON.parse(raw) as FirestoreErrorInfo;
      const inner = parsed.error || '';
      if (inner.toLowerCase().includes('permission-denied') || inner.toLowerCase().includes('insufficient permissions')) {
        return 'Permission denied. Only an authorized Lucy Clean & Care owner account can perform this action.';
      }
      if (inner.toLowerCase().includes('offline') || inner.toLowerCase().includes('unavailable')) {
        return 'Unable to reach Cloud Firestore right now. Please check your internet connection and try again.';
      }
      if (inner.toLowerCase().includes('quota exceeded')) {
        return 'Daily Firestore quota limit reached. Please try again later or upgrade the Firebase plan.';
      }
      return inner || fallbackMessage;
    } catch {
      return raw || fallbackMessage;
    }
  }

  if (raw.toLowerCase().includes('permission-denied') || raw.toLowerCase().includes('insufficient permissions')) {
    return 'Permission denied. Only an authorized Lucy Clean & Care owner account can perform this action.';
  }
  if (raw.toLowerCase().includes('offline')) {
    return 'Unable to reach Cloud Firestore right now. Please check your internet connection.';
  }
  return raw || fallbackMessage;
}

export async function verifyFirestoreConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'siteConfig', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration — Firestore client is offline.');
    }
    return false;
  }
}
