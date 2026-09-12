import {
  batchFS,
  createFS,
  deleteFS,
  readFS,
  setFS,
  storageBatchDelete,
  storageBatchUpload,
  storageDelete,
  storageDownload,
  storageGetMetadata,
  storageList,
  storageUpdateMetadata,
  storageUpload,
  updateFS,
} from ".";


/**
 * Firestore CRUD Utility with Algolia Search
 * Provides consistent and simplified wrappers for Firestore operations and Algolia search.
 */
const FS = {
  /**
   * READ: Fetch or listen to Firestore documents/collections
   * 
   * @param {Object} params
   * @param {string} params.path - Firestore path ("users" or "users/userId")
   * @param {function} [params.onResult] - Callback to receive data or error
   * @param {boolean} [params.listen=false] - Enable real-time updates
   * @param {number} [params.limitNum] - Limit query results
   * @param {{field: string, direction: 'asc'|'desc'}} [params.order] - Order results
   * @param {Array<{field: string, condition: string, value: any}>} [params.query] - Query conditions
   * @param {any} [params.startAfterDoc] - Document snapshot or value for pagination
   * @param {boolean} [params.startAtDoc=false] - Use startAt instead of startAfter for pagination
   * 
   * @returns {Promise<function|null>} Unsubscribe function (if listen enabled)
   */
  read:readFS,

  /**
   * CREATE: Add a new document to a collection
   */
  create:createFS,

  /**
   * SET: Create or overwrite a document with a specific ID
   */
  set:setFS,

  /**
   * UPDATE: Update specific fields in a document
   */
  update:updateFS,

  /**
   * DELETE: Delete a document
   */
  remove:deleteFS,

  /**
   * BATCH: Perform multiple write operations atomically
   */
  batch:batchFS,

  /**
   * STORAGE UPLOAD: Upload a file to Firebase Storage
   * 
   * @param {Object} params
   * @param {string} params.path - Storage path (e.g., "users/userId/profile.jpg")
   * @param {File|Blob|Uint8Array} params.file - File to upload
   * @param {Object} [params.metadata] - File metadata (contentType, customMetadata, etc.)
   * @param {function} [params.onProgress] - Progress callback (progress, snapshot)
   * @param {function} [params.onError] - Error callback
   * @param {function} [params.onComplete] - Completion callback (downloadURL)
   * 
   * @returns {Promise<string>} Download URL of uploaded file
   */
  storageUpload:storageUpload,

  /**
   * STORAGE DOWNLOAD: Get download URL for a file
   * 
   * @param {Object} params
   * @param {string} params.path - Storage path
   * 
   * @returns {Promise<string>} Download URL
   */
  storageDownload:storageDownload,

  /**
   * STORAGE DELETE: Delete a file from Firebase Storage
   * 
   * @param {Object} params
   * @param {string} params.path - Storage path
   * 
   * @returns {Promise<void>}
   */
  storageDelete:storageDelete,

  /**
   * STORAGE LIST: List all files in a directory
   * 
   * @param {Object} params
   * @param {string} params.path - Directory path
   * @param {number} [params.maxResults] - Maximum number of results
   * 
   * @returns {Promise<Object>} Object with items and prefixes
   */
  storageList:storageList,

  /**
   * STORAGE GET METADATA: Get file metadata
   * 
   * @param {Object} params
   * @param {string} params.path - Storage path
   * 
   * @returns {Promise<Object>} File metadata
   */
  storageGetMetadata:storageGetMetadata,

  /**
   * STORAGE UPDATE METADATA: Update file metadata
   * 
   * @param {Object} params
   * @param {string} params.path - Storage path
   * @param {Object} params.metadata - New metadata
   * 
   * @returns {Promise<Object>} Updated metadata
   */
  storageUpdateMetadata:storageUpdateMetadata,

  /**
   * STORAGE BATCH UPLOAD: Upload multiple files simultaneously
   * 
   * @param {Object} params
   * @param {Array<Object>} params.files - Array of file objects
   * @param {string} params.files[].path - Storage path for the file
   * @param {File|Blob} params.files[].file - File to upload
   * @param {Object} [params.files[].metadata] - File metadata
   * @param {function} [params.onProgress] - Progress callback (filesCompleted, totalFiles, currentFile)
   * @param {function} [params.onFileComplete] - Callback when each file completes (downloadURL, index, path)
   * @param {function} [params.onFileError] - Callback when a file fails (error, index, path)
   * @param {boolean} [params.parallel=true] - Upload in parallel or sequentially
   * 
   * @returns {Promise<Array>} Array of results with { path, downloadURL, error }
   */
  storageBatchUpload:storageBatchUpload,

  /**
   * STORAGE BATCH DELETE: Delete multiple files
   * 
   * @param {Object} params
   * @param {Array<string>} params.paths - Array of file paths to delete
   * @param {function} [params.onProgress] - Progress callback (filesCompleted, totalFiles)
   * @param {function} [params.onFileComplete] - Callback when each file is deleted (path, index)
   * @param {function} [params.onFileError] - Callback when deletion fails (error, path, index)
   * @param {boolean} [params.parallel=true] - Delete in parallel or sequentially
   * 
   * @returns {Promise<Array>} Array of results with { path, success, error }
   */
  storageBatchDelete:storageBatchDelete
};

export { FS };