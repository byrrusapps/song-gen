import { ref, listAll } from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface StorageListParams {
  path: string;
}

interface StorageItem {
  name: string;
  fullPath: string;
  bucket: string;
}

interface StoragePrefix {
  name: string;
  fullPath: string;
}

interface StorageListResult {
  items: StorageItem[];
  prefixes: StoragePrefix[];
}

const storageList = async ({ 
  path, 
}: StorageListParams): Promise<StorageListResult> => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);

    return {
      items: result.items.map(item => ({
        name: item.name,
        fullPath: item.fullPath,
        bucket: item.bucket
      })),
      prefixes: result.prefixes.map(prefix => ({
        name: prefix.name,
        fullPath: prefix.fullPath
      }))
    };
  } catch (error) {
    console.error("Error listing storage files:", error);
    throw error;
  }
};

export { 
  storageList, 
  type StorageListParams, 
  type StorageListResult,
  type StorageItem,
  type StoragePrefix
};