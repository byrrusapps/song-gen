import {
  collection,
  query as fsQuery,
  where,
  orderBy,
  limit,
  startAfter,
  startAt,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  type Unsubscribe,
  QueryConstraint,
  type DocumentData,
  QueryDocumentSnapshot,
 type DocumentSnapshot,
 type QuerySnapshot,
} from "firebase/firestore";
import { firestore } from "./init/InitFirebase";

export type onResult<T> = (data: T[] | T | null, snap: QueryDocumentSnapshot<DocumentData> | QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData> | null, error?: unknown) => void

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
  onResult?: onResult<T>;
  listen?: boolean;
  limitNum?: number;
  order?: FirestoreOrder;
  query?: FirestoreQuery[];
  startAfterDoc?: QueryDocumentSnapshot<T>;
  startAtDoc?: boolean;
}

export const readFS = async <T = DocumentData>(
  {
    path,
    onResult,
    listen = false,
    limitNum,
    order,
    query = [],
    startAfterDoc,
    startAtDoc = false,
  }: ReadOptions<T>
): Promise<Unsubscribe | null> => {
  let unsubscribe: Unsubscribe | null = null;

  try {
    const pathSegments = path.split("/").filter(Boolean);

    // --- Collection Read ---
    if (pathSegments.length % 2 !== 0) {
      const collectionRef = collection(firestore, ...(pathSegments as [string, ...string[]]));
      const constraints: QueryConstraint[] = [];

      // Apply constraints
      if (order) constraints.push(orderBy(order.field, order.direction));
      for (const { field, condition, value } of query) {
        constraints.push(where(field, condition as any, value));
      }
      if (limitNum) constraints.push(limit(limitNum));
      if (startAfterDoc) {
        constraints.push(startAtDoc ? startAt(startAfterDoc) : startAfter(startAfterDoc));
      }

      const q = constraints.length ? fsQuery(collectionRef, ...constraints) : collectionRef;

      if (listen) {
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
            onResult?.(docs, snapshot);
          },
          (error) => {
            console.error("Firestore listener error:", error);
            onResult?.(null, null, error);
          }
        );
      } else {
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
        onResult?.(docs, snapshot);
      }
    }
    // --- Single Document Read ---
    else {
      const documentRef = doc(firestore, ...(pathSegments as [string, ...string[]]));

      if (listen) {
        unsubscribe = onSnapshot(
          documentRef,
          (docSnap) => {
            const data = docSnap.exists()
              ? ({ id: docSnap.id, ...docSnap.data() } as T)
              : null;
            onResult?.(data, docSnap);
          },
          (error) => {
            console.error("Firestore listener error:", error);
            onResult?.(null, null, error);
          }
        );
      } else {
        const docSnap = await getDoc(documentRef);
        const data = docSnap.exists()
          ? ({ id: docSnap.id, ...docSnap.data() } as T)
          : null;
        onResult?.(data, docSnap);
      }
    }
  } catch (error) {
    console.error("Error reading Firestore data:", error);
    onResult?.(null, null, error);
  }

  return unsubscribe;
};
