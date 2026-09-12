"use server";

import { 
  batch,
  create,
  deleteFS,
  read,
  set,
  storageBatchDelete,
  storageBatchUpload,
  storageDelete,
  storageDownload,
  storageGetMetadata,
  storageList,
  storageUpdateMetadata,
  storageUpload,
} from './firestoreOperations/index.server'; // Move implementations here

/**
 * Firestore CRUD Utility with Algolia Search
 * Provides consistent and simplified wrappers for Firestore operations and Algolia search.
 */
export const FS = {
  read,
  create,
  set,
  remove: deleteFS,
  batch,
  storageUpload,
  storageDownload,
  storageDelete,
  storageList,
  storageGetMetadata,
  storageUpdateMetadata,
  storageBatchUpload,
  storageBatchDelete
};