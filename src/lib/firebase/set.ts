import {
  doc,
  setDoc,
  serverTimestamp,
  DocumentReference,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { firestore } from "./init/InitFirebase";

export interface SetOptions<T extends DocumentData = Record<string, any>> {
  path: string;
  data: T;
  merge?: boolean;
  autoTimestamp?: boolean;
}

export const setFS = async <T extends DocumentData = Record<string, any>>({
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

    // 🔹 Type assertion fixes TS generic strictness
    const documentRef = doc(firestore, ...(pathSegments as [string, ...string[]])) as DocumentReference<T>;

    const documentData: WithFieldValue<T & { createdAt?: any; updatedAt?: any }> = autoTimestamp
      ? {
          createdAt: (data as any).createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...data,
        }
      : data as WithFieldValue<T>;

    await setDoc(documentRef, documentData, { merge });
  } catch (error) {
    console.error("Error setting document:", error);
    throw error;
  }
};
