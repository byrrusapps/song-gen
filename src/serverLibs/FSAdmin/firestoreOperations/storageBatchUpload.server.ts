"use server";

import { getStorage } from "firebase-admin/storage";

interface FileToUpload {
  path: string;
  file: Buffer; // Simplified to just Buffer
  metadata?: {
    contentType?: string;
    customMetadata?: { [key: string]: string };
    cacheControl?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    contentLanguage?: string;
  };
}

interface BatchUploadResult {
  path: string;
  downloadURL?: string;
  error?: string;
  success: boolean;
}

interface StorageBatchUploadParams {
  files: FileToUpload[];
  onProgress?: (completedCount: number, totalCount: number, currentPath: string) => void;
  onFileComplete?: (downloadURL: string, index: number, path: string) => void;
  onFileError?: (error: unknown, index: number, path: string) => void;
  parallel?: boolean;
  makePublic?: boolean;
}

const storageBatchUpload = async ({
  files,
  onProgress,
  onFileComplete,
  onFileError,
  parallel = true,
  makePublic = false
}: StorageBatchUploadParams): Promise<BatchUploadResult[]> => {
  try {
    const results: BatchUploadResult[] = [];
    let completedCount = 0;

    // Get the storage bucket
    const bucket = getStorage().bucket();

    if (parallel) {
      // Upload all files in parallel
      const uploadPromises = files.map(async ({ path, file, metadata }, index) => {
        try {
          // Remove leading slash if present for Admin SDK
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          
          // Create file reference and upload
          const fileRef = bucket.file(cleanPath);
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

          completedCount++;
          onProgress?.(completedCount, files.length, path);
          onFileComplete?.(downloadURL, index, path);
          
          return { path, downloadURL, success: true };
        } catch (error) {
          completedCount++;
          onProgress?.(completedCount, files.length, path);
          onFileError?.(error, index, path);
          
          return { 
            path, 
            error: error instanceof Error ? error.message : String(error), 
            success: false 
          };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      results.push(...uploadResults);
    } else {
      // Upload files sequentially
      for (let index = 0; index < files.length; index++) {
        const { path, file, metadata } = files[index];
        
        try {
          // Remove leading slash if present for Admin SDK
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          
          // Create file reference and upload
          const fileRef = bucket.file(cleanPath);
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
                expires: '03-01-2500',
              }).then(([url]) => url);

          completedCount++;
          onProgress?.(completedCount, files.length, path);
          onFileComplete?.(downloadURL, index, path);
          
          results.push({ path, downloadURL, success: true });
        } catch (error) {
          completedCount++;
          onProgress?.(completedCount, files.length, path);
          onFileError?.(error, index, path);
          
          results.push({ 
            path, 
            error: error instanceof Error ? error.message : String(error), 
            success: false 
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Error in batch upload:", error);
    throw error;
  }
};

export { 
  storageBatchUpload, 
  type StorageBatchUploadParams,
  type FileToUpload,
  type BatchUploadResult
};