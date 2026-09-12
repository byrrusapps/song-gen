"use server";

import { 
  WriteBatch, 
  DocumentReference, 
  type DocumentData, 
  type WithFieldValue, 
  type UpdateData 
} from "firebase-admin/firestore";
import { firestore } from "../init/InitFirebase.server"; // Your Firebase Admin initialization

export type BatchOperationType = "set" | "update" | "delete";

export interface BatchOperation<T extends DocumentData = Record<string, any>> {
  type: BatchOperationType;
  path: string;
  data?: any; // for set/update
  merge?: boolean; // only for set
}

export interface BatchOptions<T extends DocumentData = Record<string, any>> {
  operations: BatchOperation<T>[];
}

export const batch = async <T extends DocumentData = Record<string, any>>({
  operations,
}: BatchOptions<T>): Promise<void> => {
  try {
    const batch: WriteBatch = firestore.batch();

    for (const op of operations) {
      const pathSegments = op.path.split("/").filter(Boolean);

      if (pathSegments.length === 0) throw new Error("Invalid path");

      const docRef = firestore.doc(op.path) as DocumentReference<T>;

      switch (op.type) {
        case "set":
          batch.set(
            docRef,
            op.data as WithFieldValue<T>,
            op.merge ? { merge: true } : {}
          );
          break;

        case "update":
          batch.update(
            docRef,
            op.data as UpdateData<T>
          );
          break;

        case "delete":
          batch.delete(docRef);
          break;

        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error("Error executing batch operation:", error);
    throw error;
  }
};
