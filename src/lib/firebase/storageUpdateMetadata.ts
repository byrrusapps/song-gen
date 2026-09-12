import { ref, updateMetadata, type SettableMetadata, type FullMetadata } from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface StorageUpdateMetadataParams {
  path: string;
  metadata: SettableMetadata;
}

const storageUpdateMetadata = async ({ 
  path, 
  metadata 
}: StorageUpdateMetadataParams): Promise<FullMetadata> => {
  try {
    const storageRef = ref(storage, path);
    const updatedMetadata = await updateMetadata(storageRef, metadata);
    return updatedMetadata;
  } catch (error) {
    console.error("Error updating metadata:", error);
    throw error;
  }
};

export { storageUpdateMetadata, type StorageUpdateMetadataParams };