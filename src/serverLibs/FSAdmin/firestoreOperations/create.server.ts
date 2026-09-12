"use server";

import {
  DocumentReference,
  type DocumentData,
  type WithFieldValue,
  FieldValue,
} from "firebase-admin/firestore";
import { firestore } from "../init/InitFirebase.server"; // Your Firebase Admin initialization

export interface CreateOptions<T extends DocumentData = Record<string, any>> {
  path: string;
  data: T;
  autoTimestamp?: boolean;
}

export const create = async <T extends DocumentData = Record<string, any>>({
  path,
  data,
  autoTimestamp = true,
}: CreateOptions<T>): Promise<string> => {
  try {
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length % 2 === 0) {
      throw new Error("CREATE requires a collection path (odd number of segments)");
    }

    const collectionRef = firestore.collection(path);

    const documentData: WithFieldValue<T & { createdAt?: FieldValue; updatedAt?: FieldValue }> = autoTimestamp
      ? { 
          ...data, 
          createdAt: FieldValue.serverTimestamp(), 
          updatedAt: FieldValue.serverTimestamp() 
        }
      : data as WithFieldValue<T>;

    // 🔹 Admin SDK uses collectionRef.add() instead of addDoc()
    const docRef = await collectionRef.add(documentData) as DocumentReference<T>;

    return docRef.id;
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};