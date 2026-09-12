import { doc, deleteDoc, DocumentReference, type DocumentData } from "firebase/firestore";
import { firestore } from "./init/InitFirebase";

export interface DeleteOptions {
  path: string;
}

export const deleteFS = async <T extends DocumentData = Record<string, any>>({
  path,
}: DeleteOptions): Promise<void> => {
  try {
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length % 2 !== 0) {
      throw new Error("DELETE requires a document path (even number of segments)");
    }

    // 🔹 Tuple assertion and generic DocumentReference
    const documentRef = doc(firestore, ...(pathSegments as [string, ...string[]])) as DocumentReference<T>;

    await deleteDoc(documentRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};
