"use server";

import { DocumentReference, type DocumentData } from "firebase-admin/firestore";
import { firestore } from "../init/InitFirebase.server"; // Your Firebase Admin initialization

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

    // 🔹 Admin SDK uses firestore.doc() instead of doc()
    const documentRef = firestore.doc(path) as DocumentReference<T>;

    await documentRef.delete();
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};