import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  type UploadMetadata,
  type UploadTaskSnapshot,
  StorageError
} from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface StorageUploadParams {
  path: string;
  file: Blob | Uint8Array | ArrayBuffer;
  metadata?: UploadMetadata;
  onProgress?: (progress: number, snapshot: UploadTaskSnapshot) => void;
  onError?: (error: StorageError) => void;
  onComplete?: (downloadURL: string) => void;
  signal?: AbortSignal; // 1. Add optional AbortSignal
}

const storageUpload = async ({
  path,
  file,
  metadata = {},
  onProgress,
  onError,
  onComplete,
  signal // 2. Destructure signal
}: StorageUploadParams): Promise<string> => {
  
  // 3. Early exit if already aborted before calling
  if (signal?.aborted) {
    return Promise.reject(new Error("Upload aborted before starting."));
  }

  try {
    const storageRef = ref(storage, path);

    // 4. Force resumable upload if a signal is passed
    if (onProgress || onError || onComplete || signal) {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // 5. Listen for the abort signal to cancel the Firebase task
      if (signal) {
        signal.addEventListener('abort', () => {
          uploadTask.cancel();
        });
      }

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress, snapshot);
          },
          (error) => {
            // 6. Gracefully handle the cancellation error
            if (error.code === 'storage/canceled') {
              console.warn("Upload was manually canceled.");
            } else {
              console.error("Error uploading file:", error);
            }
            onError?.(error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onComplete?.(downloadURL);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // Simple upload without progress tracking or cancellation
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    }
  } catch (error) {
    console.error("Error uploading to storage:", error);
    throw error;
  }
};

export { storageUpload, type StorageUploadParams };