import { getAuth, signOut } from "firebase/auth";
import type { Setter } from "solid-js";
import type { MSG } from "../../types/notifications/SnackBarMSG";

interface SignOutITF {
  setMsgList: Setter<MSG[]>;
  callback?:{
    success?: ({}) => void;
    error?: ({}) => void;
  };
}

const SignOut = ({
  setMsgList,
  callback}: SignOutITF): void => {
  const auth = getAuth();

  signOut(auth)
    .then(() => {

        setMsgList((prev) => [
      ...(prev || []),
      {
        type: "success",
        msg: "Signed out successfully",
        open: false,
      },
    ]);

        if (callback?.success && typeof callback.success === "function") {
          callback.success({data: auth.currentUser});
        }

  })
    .catch((error) => {

              setMsgList((prev) => [
      ...(prev || []),
      {
        type: "error",
        msg: "Sign out failed!",
        open: false,
      },
    ]);

                if (callback?.error && typeof callback.error === "function") {
      callback.error({data: error});
    }
    
    });

};

export default SignOut;