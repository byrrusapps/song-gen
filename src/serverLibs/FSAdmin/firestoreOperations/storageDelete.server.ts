"use server";

import { getStorage } from "firebase-admin/storage";

interface StorageDeleteParams {
  path: string;
}

const storageDelete = async ({ path }: StorageDeleteParams): Promise<void> => {
  try {
    // Get the storage bucket
    const bucket = getStorage().bucket();
    
    // Remove leading slash if present for Admin SDK
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Delete the file
    await bucket.file(cleanPath).delete();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export { storageDelete, type StorageDeleteParams };