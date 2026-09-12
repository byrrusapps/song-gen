"use server";

import { getStorage } from "firebase-admin/storage";

interface StorageDownloadParams {
  path: string;
  expiresIn?: string | number; // Optional: expiration for signed URLs (default 15 minutes)
  makePublic?: boolean; // Optional: make file public and return public URL
}

const storageDownload = async ({ 
  path, 
  expiresIn = '15 minutes',
  makePublic = false
}: StorageDownloadParams): Promise<string> => {
  try {
    // Get the storage bucket
    const bucket = getStorage().bucket();
    
    // Remove leading slash if present for Admin SDK
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    const fileRef = bucket.file(cleanPath);

    // Make file public if requested
    if (makePublic) {
      await fileRef.makePublic();
      return `https://storage.googleapis.com/${bucket.name}/${cleanPath}`;
    }

    // Generate signed URL for private files
    const [downloadURL] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + (typeof expiresIn === 'string' ? 
        (expiresIn.includes('minute') ? 15 * 60 * 1000 : // Default 15 minutes
         expiresIn.includes('hour') ? 60 * 60 * 1000 :
         expiresIn.includes('day') ? 24 * 60 * 60 * 1000 :
         15 * 60 * 1000) : 
        expiresIn), // If number, treat as milliseconds
    });

    return downloadURL;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};

export { storageDownload, type StorageDownloadParams };