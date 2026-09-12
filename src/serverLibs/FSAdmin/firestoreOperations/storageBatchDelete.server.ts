"use server";

import { getStorage } from "firebase-admin/storage";

interface BatchDeleteResult {
  path: string;
  success: boolean;
  error?: string;
}

interface StorageBatchDeleteParams {
  paths: string[];
  onProgress?: (completedCount: number, totalCount: number) => void;
  onFileComplete?: (path: string, index: number) => void;
  onFileError?: (error: unknown, path: string, index: number) => void;
  parallel?: boolean;
}

const storageBatchDelete = async ({
  paths,
  onProgress,
  onFileComplete,
  onFileError,
  parallel = true
}: StorageBatchDeleteParams): Promise<BatchDeleteResult[]> => {
  try {
    const results: BatchDeleteResult[] = [];
    let completedCount = 0;

    // Get the storage bucket - Admin SDK uses bucket instead of ref
    const bucket = getStorage().bucket();

    if (parallel) {
      const deletePromises = paths.map(async (path, index) => {
        try {
          // Remove leading slash if present for Admin SDK
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          
          await bucket.file(cleanPath).delete();
          
          completedCount++;
          onProgress?.(completedCount, paths.length);
          onFileComplete?.(path, index);
          
          return { path, success: true };
        } catch (error) {
          completedCount++;
          onProgress?.(completedCount, paths.length);
          onFileError?.(error, path, index);
          
          return { 
            path, 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });

      const deleteResults = await Promise.all(deletePromises);
      results.push(...deleteResults);
    } else {
      for (let index = 0; index < paths.length; index++) {
        const path = paths[index];
        
        try {
          // Remove leading slash if present for Admin SDK
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          
          await bucket.file(cleanPath).delete();
          
          completedCount++;
          onProgress?.(completedCount, paths.length);
          onFileComplete?.(path, index);
          
          results.push({ path, success: true });
        } catch (error) {
          completedCount++;
          onProgress?.(completedCount, paths.length);
          onFileError?.(error, path, index);
          
          results.push({ 
            path, 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Error in batch delete:", error);
    throw error;
  }
};

export { 
  storageBatchDelete, 
  type StorageBatchDeleteParams,
  type BatchDeleteResult
};