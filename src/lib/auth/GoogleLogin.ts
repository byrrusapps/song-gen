import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/init/InitFirebase";
import type { Setter } from "solid-js";
import type { MSG } from "../../types/notifications/SnackBarMSG";

interface GoogleLoginParams {
  setMsgList: Setter<MSG[]>;
  callback?:{
    success?: ({}) => void;
    error?: ({}) => void;
  };
}

const GoogleLogin = async ({
  setMsgList,
  callback,
}: GoogleLoginParams): Promise<void> => {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);

        setMsgList((prev) => [
      ...(prev || []),
      {
        type: "success",
        msg: "Signed in successfully. Updating user data...",
        open: false,
      },
    ]);
    
    if (callback?.success && typeof callback.success === "function") {
      callback.success({data: auth.currentUser});
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";

        setMsgList((prev) => [
      ...(prev || []),
      {
        type: "error",
        msg: errorMessage,
        open: false,
      },
    ]);

        if (callback?.error && typeof callback.error === "function") {
      callback.error({data: error});
    }

  }
};

export default GoogleLogin;