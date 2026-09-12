"use server";

import { getStorage } from "firebase-admin/storage";

interface StorageUpdateMetadataParams {
  path: string;
  metadata: {
    contentType?: string;
    customMetadata?: { [key: string]: string };
    cacheControl?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    contentLanguage?: string;
  };
}

// Admin SDK File metadata interface
interface StorageMetadata {
  name: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  cacheControl?: string;
  size: number;
  timeCreated: string;
  updated: string;
  md5Hash?: string;
  crc32c?: string;
  etag: string;
  downloadTokens?: string[];
  customMetadata?: { [key: string]: string };
}

const storageUpdateMetadata = async ({ 
  path, 
  metadata 
}: StorageUpdateMetadataParams): Promise<StorageMetadata> => {
  try {
    // Get the storage bucket
    const bucket = getStorage().bucket();
    
    // Remove leading slash if present for Admin SDK
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    const fileRef = bucket.file(cleanPath);
    
    // Update metadata - Admin SDK uses setMetadata instead of updateMetadata
    const [updatedMetadata] = await fileRef.setMetadata(metadata);
    
    return updatedMetadata as StorageMetadata;
  } catch (error) {
    console.error("Error updating metadata:", error);
    throw error;
  }
};

export { 
  storageUpdateMetadata, 
  type StorageUpdateMetadataParams, 
  type StorageMetadata 
};