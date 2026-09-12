"use server";

import { firestore } from "../init/InitFirebase.server";
import {
  Query,
  DocumentReference,
  type DocumentData,
  QueryDocumentSnapshot,
  type WhereFilterOp,
  type OrderByDirection,
} from "firebase-admin/firestore";

export interface FirestoreQuery {
  field: string;
  condition:
    | "==" | "!="
    | "<" | "<=" | ">" | ">="
    | "array-contains"
    | "array-contains-any"
    | "in" | "not-in";
  value: any;
}

export interface FirestoreOrder {
  field: string;
  direction?: "asc" | "desc";
}

export interface ReadOptions<T = DocumentData> {
  path: string;
  limitNum?: number;
  order?: FirestoreOrder;
  query?: FirestoreQuery[];
  startAfterDoc?: QueryDocumentSnapshot<T>;
  startAtDoc?: boolean;
}

export interface ReadDocumentOptions {
  path: string;
}

// Single document read
export const readDocument = async <T = DocumentData>({
  path,
}: ReadDocumentOptions): Promise<T | null> => {
  try {
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length % 2 !== 0) {
      throw new Error("READ DOCUMENT requires a document path (even number of segments)");
    }


    const documentRef = firestore.doc(path) as DocumentReference<T>;
    const docSnap = await documentRef.get();

    return docSnap.exists
      ? ({ id: docSnap.id, ...docSnap.data() } as T)
      : null;
  } catch (error) {
    console.error("Error reading Firestore document:", error);
    throw error;
  }
};

// Collection query
export const readCollection = async <T = DocumentData>({
  path,
  limitNum,
  order,
  query = [],
  startAfterDoc,
  startAtDoc = false,
}: ReadOptions<T>): Promise<T[]> => {
  try {
    const pathSegments = path.split("/").filter(Boolean);

    if (pathSegments.length % 2 === 0) {
      throw new Error("READ COLLECTION requires a collection path (odd number of segments)");
    }

    // Start with CollectionReference and cast to Query<DocumentData>
    let collectionQuery: Query<DocumentData> = firestore.collection(path);

    // Apply queries
    for (const { field, condition, value } of query) {
      collectionQuery = collectionQuery.where(field, condition as WhereFilterOp, value);
    }

    // Apply ordering
    if (order) {
      collectionQuery = collectionQuery.orderBy(order.field, order.direction as OrderByDirection);
    }

    // Apply limit
    if (limitNum) {
      collectionQuery = collectionQuery.limit(limitNum);
    }

    // Apply pagination
    if (startAfterDoc) {
      collectionQuery = startAtDoc 
        ? collectionQuery.startAt(startAfterDoc)
        : collectionQuery.startAfter(startAfterDoc);
    }

    const snapshot = await collectionQuery.get();
    
    // Cast the results to the generic type T
    return snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    } as unknown as T));
  } catch (error) {
    console.error("Error reading Firestore collection:", error);
    throw error;
  }
};

// Unified read function (for backward compatibility)
export const read = async <T = DocumentData>({
  path,
  limitNum,
  order,
  query = [],
  startAfterDoc,
  startAtDoc = false,
}: ReadOptions<T>): Promise<T[] | T | null> => {
  const pathSegments = path.split("/").filter(Boolean);

  if (pathSegments.length % 2 === 0) {
    // Document path
    return readDocument<T>({ path });
  } else {
    // Collection path
    return readCollection<T>({
      path,
      limitNum,
      order,
      query,
      startAfterDoc,
      startAtDoc,
    });
  }
};