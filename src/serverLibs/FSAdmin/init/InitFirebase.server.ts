"use server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";


const existing = getApps().find(a => a.name === "solidstart");
export const app = existing ?? initializeApp({
  projectId: process.env.PROJECT_ID,
  credential: cert({
    projectId: process.env.PROJECT_ID,
    privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.CLIENT_EMAIL,
  }),
}, "solidstart");

export const firestore = getFirestore(app);
export const storage = getStorage(app);