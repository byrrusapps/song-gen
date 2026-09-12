import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface StorageDownloadParams {
  path: string;
}

const storageDownload = async ({ path }: StorageDownloadParams): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};

export { storageDownload, type StorageDownloadParams };