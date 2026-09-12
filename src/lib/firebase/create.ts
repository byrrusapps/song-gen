import {
  collection,
  addDoc,
  serverTimestamp,
  DocumentReference,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { firestore } from "./init/InitFirebase";

export interface CreateOptions<T extends DocumentData = Record<string, any>> {
  path: string;
  data: T;
  autoTimestamp?: boolean;
}

export const createFS = async <T extends DocumentData = Record<string, any>>({
  path,
  data,
  autoTimestamp = true,
}: CreateOptions<T>): Promise<string> => {
  try {
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length % 2 === 0) {
      throw new Error("CREATE requires a collection path (odd number of segments)");
    }

    const collectionRef = collection(firestore, ...(pathSegments as [string, ...string[]]));

    const documentData: WithFieldValue<T & { createdAt?: any; updatedAt?: any }> = autoTimestamp
      ? { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      : data as WithFieldValue<T>;

    // 🔹 Type assertion fixes the TS strictness issue
    const docRef = await addDoc(collectionRef, documentData) as DocumentReference<T>;

    return docRef.id;
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};
