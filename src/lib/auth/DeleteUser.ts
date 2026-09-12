import { getFunctions, httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { auth } from "../firebase/init/InitFirebase";

// Type definitions based on the backend function
interface DeleteUserRequest {
  reason?: string;
  feedback?: string;
}

interface DeleteUserResponse {
  ok: boolean;
  uid: string;
  message?: string;
}

interface DeleteUserResult {
  ok: boolean;
  result?: DeleteUserResponse;
  error?: string;
}

export async function DeleteUser(): Promise<DeleteUserResult> {
  if (!auth.currentUser) {
    return { 
      ok: false, 
      error: "User not signed in." 
    };
  }

  const functions = getFunctions();
  
  try {
    const delUser = httpsCallable<DeleteUserRequest, DeleteUserResponse>(
      functions, 
      "deleteUser"
    );
    
    const res: HttpsCallableResult<DeleteUserResponse> = await delUser();
    
    return { 
      ok: true, 
      result: res.data 
    };
    
  } catch (err: any) {
    console.error("Failed to delete user:", err);
    
    // Extract error message safely
    let errorMessage = "Unknown error occurred";
    
    if (typeof err === "string") {
      errorMessage = err;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    } else if (err?.message) {
      errorMessage = err.message;
    } else if (err?.data?.message) {
      errorMessage = err.data.message;
    }
    
    return { 
      ok: false, 
      error: errorMessage 
    };
  }
}

// Optional: You can also export the type for use in other components
export type { DeleteUserResult, DeleteUserResponse, DeleteUserRequest };