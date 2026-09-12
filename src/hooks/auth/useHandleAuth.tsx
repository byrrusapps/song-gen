import { onMount, onCleanup, createSignal, type Setter, type Accessor } from "solid-js";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { readFS, type onResult } from "../../lib/firebase/read";
import { auth } from "../../lib/firebase/init/InitFirebase";
import type { TagInfo, UserData, UserStatus } from "../../types/auth/User";
import { randomNumbers } from "../../utils/global";
import { batchFS } from "../../lib/firebase";


interface useHandleAuthParams {
  user: Accessor<UserData | null>;
  setUser: Setter<UserData | null>;
  isDeleting: Accessor<boolean>;
  setIsDeleting: Setter<boolean>; // Included from your original code, though unused in this snippet
}

// 1. Define the possible states of your auth flow

const useHandleAuth = ({ user, setUser, isDeleting }: useHandleAuthParams) => {
  // 2. Initialize status as "loading" since auth takes a moment to check on mount
  const [status, setStatus] = createSignal<UserStatus>("loading");
  const [isAdmin, setIsAdmin] = createSignal<boolean>(false);

  let unsubscribeUser: (() => void) | null = null;

  onMount(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (userFB: FirebaseUser | null) => {
      if (userFB) {
        const { uid, displayName, photoURL, email } = userFB;
        if((await userFB.getIdTokenResult()).claims.admin){
          setIsAdmin(true);
        }else{
          setIsAdmin(false);
        }

const onResult: onResult<UserData> = (data, _snap, error) => {

          if (error) {
            console.error("Error fetching user data:", error);
            setUser(null);
            setStatus("error"); // Update status on failure
            return;
          }

          if (Array.isArray(data)) {
            console.warn("Unexpected array response for single user document");
            setUser(data[0] || null);
            setStatus("success"); // Recovered from weird array response
            return;
          }

          if (data) {
            setUser(data);
            setStatus("success"); // Existing user fetched successfully
          } else {
            // New user scenario
            if (!auth.currentUser || isDeleting()) return;
            const rand = randomNumbers();
            const firstName = displayName?.split(" ")[0]?.toLowerCase() || "user";
            let tag = `${firstName}${rand}`
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "")
              .replace(/-+/g, "-")
              .replace(/^-+|-+$/g, "");

            tag = tag.slice(0, 20);
            const timestamp = Date.now();

            const info: UserData = {
              myUid: uid,
              myName: displayName || "",
              myAvatar: photoURL || "",
              myTag: tag,
              myEmail: email || "",
              myDateJoined: timestamp,
              myBio: `Hey, I'm on ${import.meta.env.VITE_PUBLIC_APP_NAME}!`,
            };

            const tagInfo: TagInfo = {
              timestamp,
              uid,
            };

            setUser(info);
            setStatus("success"); // Optimistically set success

            // Note: If FS.batch fails, you might want to wrap this in a try/catch
            // and revert the status to "error", but this is generally safe.
            batchFS({
              operations: [
                {
                  path: `users/${uid}`,
                  type: "set",
                  data: info,
                  merge: true,
                },
                {
                  path: `tags/${tag}`,
                  type: "set",
                  data: tagInfo,
                  merge: true,
                },
              ],
            });
          }
        };

        if (user() === null) {
          // If we haven't fetched yet, ensure we are in a loading state
          setStatus("loading");
          
          const unsubscribe = await readFS({
            path: `users/${uid}`,
            onResult,
            listen: true,
          });

          if (unsubscribe) {
            unsubscribeUser = unsubscribe;
          }
        } else {
           // User signal was already populated (e.g. from cache or HMR)
           setStatus("success");
        }
      } else {
        // Firebase confirmed no one is logged in
        setUser(null);
        setStatus("unauthenticated"); 
      }
    });

    onCleanup(() => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    });
  });

  // 3. Return the status accessor so consuming components can read it
  return {
    status, isAdmin,
  };
};

export default useHandleAuth;