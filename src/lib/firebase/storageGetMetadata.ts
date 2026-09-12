import { ref, getMetadata, type FullMetadata } from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface StorageGetMetadataParams {
  path: string;
}

const storageGetMetadata = async ({ 
  path 
}: StorageGetMetadataParams): Promise<FullMetadata> => {
  try {
    const storageRef = ref(storage, path);
    const metadata = await getMetadata(storageRef);
    return metadata;
  } catch (error) {
    console.error("Error getting metadata:", error);
    throw error;
  }
};

export { storageGetMetadata, type StorageGetMetadataParams };