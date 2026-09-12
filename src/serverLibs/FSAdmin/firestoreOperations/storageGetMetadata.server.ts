"use server";

import { getStorage } from "firebase-admin/storage";

interface StorageGetMetadataParams {
  path: string;
}

// Admin SDK File metadata interface (similar to FullMetadata)
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

const storageGetMetadata = async ({ 
  path 
}: StorageGetMetadataParams): Promise<StorageMetadata> => {
  try {
    // Get the storage bucket
    const bucket = getStorage().bucket();
    
    // Remove leading slash if present for Admin SDK
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    const fileRef = bucket.file(cleanPath);
    const [metadata] = await fileRef.getMetadata();
    
    return metadata as StorageMetadata;
  } catch (error) {
    console.error("Error getting metadata:", error);
    throw error;
  }
};

export { storageGetMetadata, type StorageGetMetadataParams, type StorageMetadata };