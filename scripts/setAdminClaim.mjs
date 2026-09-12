import "dotenv/config"; // add this as the very first line
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

console.log({
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: process.env.PRIVATE_KEY?.slice(0, 30), // just the start, not the full key
});

const app = initializeApp({
  credential: cert({
    projectId: process.env.PROJECT_ID,
    privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.CLIENT_EMAIL,
  }),
});

await getAuth(app).setCustomUserClaims("EV5blYMfrVdgPn3F24HHQXzl0jk1", { admin: true });
console.log("Admin claim set.");
process.exit(0);