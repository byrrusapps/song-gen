"use server";

import { getStorage } from "firebase-admin/storage";

interface StorageUploadParams {
  path: string;
  file: Buffer; // Changed to Buffer only for Admin SDK
  metadata?: {
    contentType?: string;
    customMetadata?: { [key: string]: string };
    cacheControl?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    contentLanguage?: string;
  };
  onProgress?: (progress: number) => void; // Simplified without snapshot
  onError?: (error: Error) => void;
  onComplete?: (downloadURL: string) => void;
  makePublic?: boolean; // Admin SDK can make files public
}

const storageUpload = async ({
  path,
  file,
  metadata = {},
  onProgress,
  onError,
  onComplete,
  makePublic = false
}: StorageUploadParams): Promise<string> => {
  try {
    const bucket = getStorage().bucket();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const fileRef = bucket.file(cleanPath);

    // Admin SDK doesn't have built-in progress tracking for uploads
    // We can simulate progress for smaller files by chunking, but it's complex
    // For now, we'll call onProgress with 100% when complete
    if (onProgress) {
      // Simulate immediate completion for small files
      // For large files, you'd need to implement chunked uploads
      setTimeout(() => onProgress(100), 0);
    }

    // Upload the file
    await fileRef.save(file, {
      metadata: {
        contentType: metadata?.contentType || 'application/octet-stream',
        ...metadata
      }
    });

    // Make file public if requested
    if (makePublic) {
      await fileRef.makePublic();
    }

    // Generate download URL
    const downloadURL = makePublic 
      ? `https://storage.googleapis.com/${bucket.name}/${cleanPath}`
      : await fileRef.getSignedUrl({
          action: 'read',
          expires: '03-01-2500', // Far future expiration
        }).then(([url]) => url);

    onComplete?.(downloadURL);
    return downloadURL;

  } catch (error) {
    console.error("Error uploading to storage:", error);
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
};

export { storageUpload, type StorageUploadParams };