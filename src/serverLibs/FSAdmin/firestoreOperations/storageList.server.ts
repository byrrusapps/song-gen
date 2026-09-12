"use server";

import { getStorage } from "firebase-admin/storage";

interface StorageListParams {
  path: string;
  delimiter?: string;
  maxResults?: number;
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
  path 
}: StorageListParams): Promise<StorageListResult> => {
  try {
    const bucket = getStorage().bucket();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const folderPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
    
    const [files] = await bucket.getFiles({
      prefix: folderPath,
      delimiter: '/'
    });

    const items: StorageItem[] = [];
    const prefixes: StoragePrefix[] = [];

    // Process files and detect folders
    files.forEach(file => {
      const relativePath = file.name.replace(folderPath, '');
      const pathParts = relativePath.split('/').filter(Boolean);
      
      if (pathParts.length === 1) {
        // It's a direct file in the current folder
        items.push({
          name: pathParts[0],
          fullPath: file.name,
          bucket: file.metadata.bucket || bucket.name
        });
      } else if (pathParts.length > 1) {
        // It's in a subfolder - add the first folder to prefixes
        const folderName = pathParts[0];
        const folderFullPath = `${folderPath}${folderName}/`;
        
        // Only add if not already in prefixes
        if (!prefixes.some(p => p.fullPath === folderFullPath)) {
          prefixes.push({
            name: folderName,
            fullPath: folderFullPath
          });
        }
      }
    });

    return {
      items,
      prefixes
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