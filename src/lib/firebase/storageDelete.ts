import { ref, deleteObject, listAll } from "firebase/storage";
import { storage } from "./init/InitFirebase";

interface StorageDeleteParams {
  path: string;
}

const storageDelete = async ({ path }: StorageDeleteParams): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    
    // Try to delete as a single file first
    try {
      await deleteObject(storageRef);
      return; // Successfully deleted a single file
    } catch (fileError: any) {
      // If it's not a "not found" error for a single file, 
      // assume it might be a folder and try to delete contents
      if (fileError.code !== 'storage/object-not-found') {
        throw fileError;
      }
    }
    
    // If we reach here, try to delete as a folder
    const listResult = await listAll(storageRef);
    
    // Delete all files in the folder
    const deleteFilePromises = listResult.items.map(item => deleteObject(item));
    
    // Recursively delete all subfolders
    const deleteFolderPromises = listResult.prefixes.map(prefix => 
      storageDelete({ path: prefix.fullPath })
    );
    
    await Promise.all([...deleteFilePromises, ...deleteFolderPromises]);
    
  } catch (error) {
    console.error("Error deleting file/folder:", error);
    throw error;
  }
};

export { storageDelete, type StorageDeleteParams };