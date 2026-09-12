"use server";

import {
  DocumentReference,
  type DocumentData,
  type WithFieldValue,
  FieldValue,
} from "firebase-admin/firestore";
import { firestore } from "../init/InitFirebase.server"; // Your Firebase Admin initialization

export interface SetOptions<T extends DocumentData = Record<string, any>> {
  path: string;
  data: T;
  merge?: boolean;
  autoTimestamp?: boolean;
}

export const set = async <T extends DocumentData = Record<string, any>>({
  path,
  data,
  merge = false,
  autoTimestamp = true,
}: SetOptions<T>): Promise<void> => {
  try {
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length % 2 !== 0) {
      throw new Error("SET requires a document path (even number of segments)");
    }

    // 🔹 Admin SDK uses firestore.doc() instead of doc()
    const documentRef = firestore.doc(path) as DocumentReference<T>;

    const documentData: WithFieldValue<T & { createdAt?: FieldValue; updatedAt?: FieldValue }> = autoTimestamp
      ? {
          // Only set createdAt if it doesn't exist in the data
          createdAt: (data as any).createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          ...data,
        }
      : data as WithFieldValue<T>;

    await documentRef.set(documentData, { merge });
  } catch (error) {
    console.error("Error setting document:", error);
    throw error;
  }
};