import { ref, uploadBytes, getDownloadURL, type UploadMetadata } from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface FileToUpload {
  path: string;
  file: Blob | Uint8Array | ArrayBuffer;
  metadata?: UploadMetadata;
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
}

const storageBatchUpload = async ({
  files,
  onProgress,
  onFileComplete,
  onFileError,
  parallel = true
}: StorageBatchUploadParams): Promise<BatchUploadResult[]> => {
  try {
    const results: BatchUploadResult[] = [];
    let completedCount = 0;

    if (parallel) {
      // Upload all files in parallel
      const uploadPromises = files.map(async ({ path, file, metadata }, index) => {
        try {
          const storageRef = ref(storage, path);
          const snapshot = await uploadBytes(storageRef, file, metadata);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
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
          const storageRef = ref(storage, path);
          const snapshot = await uploadBytes(storageRef, file, metadata);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
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